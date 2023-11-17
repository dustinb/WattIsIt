#include <EEPROM.h>

// #define BMP
#ifdef BMP
  #include <Adafruit_BMP085.h>
  Adafruit_BMP085 bmp;
#endif

#define ADC
#ifdef ADC
  #include "ADS1X15.h"
  ADS1115 ADS(0x48);
#endif

#define BMP280
#ifdef BMP280
  #include "Adafruit_BMP280.h"
  Adafruit_BMP280 bmp280;
#endif

#define AHT2x
#ifdef AHT2x
  #include <AHT20.h>
  AHT20 aht20;
#endif

//////////////////////////////////////////////
//        RemoteXY include library          //
//////////////////////////////////////////////

// RemoteXY select connection mode and include library 
#define REMOTEXY_MODE__ESP32CORE_BLE
#include <BLEDevice.h>

#include <RemoteXY.h>

// RemoteXY connection settings 
#define REMOTEXY_BLUETOOTH_NAME "Battery Meter v1.0"


// RemoteXY configurate  
#pragma pack(push, 1)
uint8_t RemoteXY_CONF[] =   // 275 bytes
  { 255,2,0,110,0,12,1,16,31,1,129,0,7,59,18,6,17,84,101,109,
  112,0,67,4,6,65,20,5,2,26,11,129,0,8,45,18,6,17,70,101,
  101,116,0,67,4,6,51,20,5,2,26,11,129,0,31,45,25,6,17,80,
  114,101,115,115,117,114,101,0,67,4,33,51,20,5,2,26,11,129,0,8,
  2,18,6,17,86,111,108,116,115,0,67,4,6,8,20,5,2,26,11,129,
  0,8,17,16,6,17,87,97,116,116,115,0,67,4,6,23,20,5,2,26,
  11,129,0,31,59,25,6,17,72,117,109,105,100,105,116,121,0,67,4,33,
  65,20,5,2,26,11,129,0,34,2,18,6,17,65,109,112,115,0,67,4,
  33,8,20,5,2,26,11,129,0,7,31,18,6,17,87,104,32,73,110,0,
  67,4,6,37,20,5,2,26,11,129,0,33,31,21,6,17,87,104,32,79,
  117,116,0,67,4,33,37,20,5,2,26,11,129,0,32,17,21,6,17,87,
  104,32,68,105,102,102,0,67,4,33,23,20,5,2,26,11,1,0,38,86,
  12,12,2,31,82,101,115,101,116,0,3,131,6,90,22,8,2,26,129,0,
  5,84,26,6,17,53,48,32,55,53,32,49,48,48,0 };
  
// this structure defines all the variables and events of your control interface 
struct {

    // input variables
  uint8_t reset; // =1 if button pressed, else =0 
  uint8_t mV; // =0 if select position A, =1 if position B, =2 if position C, ... 

    // output variables
  char temp[11];  // string UTF8 end zero 
  char altitude[11];  // string UTF8 end zero 
  char pressure[11];  // string UTF8 end zero 
  char volts[11];  // string UTF8 end zero 
  char watts[11];  // string UTF8 end zero 
  char humidity[11];  // string UTF8 end zero 
  char amps[11];  // string UTF8 end zero 
  char charge[11];  // string UTF8 end zero 
  char discharge[11];  // string UTF8 end zero 
  char watts_diff[11];  // string UTF8 end zero 

    // other variable
  uint8_t connect_flag;  // =1 if wire connected, else =0 

} RemoteXY;
#pragma pack(pop)

/////////////////////////////////////////////
//           END RemoteXY include          //
/////////////////////////////////////////////


float wattHoursCharge = 0;
float wattHoursDischarge = 0;
unsigned long lastADCRead = 0;
uint8_t lastSetting = 1;

void setup() 
{
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
  #ifdef ADC
    ADS.begin();
  #endif

  #ifdef BMP
    bmp.begin();
	#endif

  #ifdef BMP280
    bmp280.begin(0x76, 0x58);
	#endif

  #ifdef AHT2x
    aht20.begin();
  #endif

  
  EEPROM.begin(1);  // Initialize EEPROM 1 bytes
  uint8_t eepromValue = EEPROM.read(0);
  if (eepromValue > 2) {
    // Default to 75mv if no value
    lastSetting = 1;
  } else {
    lastSetting = eepromValue;
  }
  
  RemoteXY_Init ();
  // Initialize the mV selector 50, 75, or 100 mv
  RemoteXY.mV = lastSetting;
  
  lastADCRead = millis();
}

void loop() 
{ 

  float temp = 0;
  float tempCount = 0;

  #ifdef BMP
    temp += (bmp.readTemperature() * 9/5) + 32;
    tempCount++;
    float pressure = bmp.readPressure();
    float altitude = bmp.readAltitude() * 3.28084;

    dtostrf(altitude, 1, 0, RemoteXY.altitude);
    dtostrf(pressure, 1, 0, RemoteXY.pressure);
  #endif

  #ifdef BMP280
    temp += (bmp280.readTemperature() * 9/5) + 32;
    tempCount++;
    float pressure = bmp280.readPressure();
    float altitude = bmp280.readAltitude() * 3.28084;

    dtostrf(altitude, 1, 0, RemoteXY.altitude);
    dtostrf(pressure, 1, 0, RemoteXY.pressure);
  #endif

  #ifdef AHT2x
    if (aht20.available() == true) {
      //Get the new temperature and humidity value
      temp += (aht20.getTemperature() * 9/5) + 32;
      tempCount++;
      float humidity = aht20.getHumidity();
      dtostrf(humidity, 1, 2, RemoteXY.humidity);
      //The AHT20 can respond with a reading every ~50ms. However, increased read time can cause the IC to heat around 1.0C above ambient.
      //The datasheet recommends reading every 2 seconds.  RemoteXY doesn't want any delay though.
      delay(200);
    }
  #endif

  #ifdef ADC
    ADS.setGain(0);
    int16_t adc = ADS.readADC(0);
    float f = ADS.toVoltage(1);
    float adcVolts = adc * f;

    // Resister values measured
    int R1 = 9880;
    int R2 = 5000;
   
    // https://ohmslawcalculator.com/voltage-divider-calculator
    float vbat = ((R1 + R2) * adcVolts) / R2;
    dtostrf(vbat, 1, 2, RemoteXY.volts);
    
    // Differential shunt current
    // https://learnarduinonow.com/2015/05/11/reading-current-shunt-with-arduino.html
    int16_t results;
    ADS.setGain(16);
    unsigned long currentTime = millis(); 
    results = ADS.readADC_Differential_2_3();
    unsigned long delta = currentTime - lastADCRead;
    lastADCRead = millis();

    float amps = ((float)results * 256.0) / 32768.0; // 100mv shunt
    if (RemoteXY.mV == 1) {
      amps = amps * 1.333; // 75mv shunt
    }
    if (RemoteXY.mV == 0) {
      amps = amps * 2; // 50mv shunt
    }  
    
    float power = amps * vbat;
    float energy = (power * delta) / (3600.0 * 1000.0);  // Convert milliseconds to hours

    if (energy < 0) {
      wattHoursCharge += energy * -1.0;
    } else {
      wattHoursDischarge += energy;
    }

    dtostrf(power, 1, 2, RemoteXY.watts);
    dtostrf(amps, 1, 2, RemoteXY.amps);
    dtostrf(wattHoursCharge, 1, 2, RemoteXY.charge);
    dtostrf(wattHoursDischarge, 1, 2, RemoteXY.discharge);
    dtostrf(wattHoursDischarge - wattHoursCharge, 1, 2, RemoteXY.watts_diff);
  #endif

  // Average temp of all sensors
  dtostrf(temp / tempCount, 1, 2, RemoteXY.temp);

  if (RemoteXY.reset == 1) {
    wattHoursCharge = 0;
    wattHoursDischarge = 0;
  }
  
  if (RemoteXY.mV != lastSetting) {
    lastSetting = RemoteXY.mV;
    EEPROM.write(0, lastSetting);
    EEPROM.commit();
  }

  RemoteXY_Handler();
  // TODO you loop code
  // use the RemoteXY structure for data transfer
  // do not call delay() 
}
