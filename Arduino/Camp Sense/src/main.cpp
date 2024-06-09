#include <Arduino.h>

#include <EEPROM.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define DEVICE_NAME "WattIsIt"

#define SERVICE_UUID "13030a97-68c2-4746-852a-3566bce33d89"
#define CHAR_UUID_WEATHER_DATA "eb19820c-c6cc-46a8-93a6-3645803d8e8f"
#define CHAR_UUID_ENERGY_DATA "1dc27998-20cd-4cf5-a5f3-3fe25f55c0f8"
#define CHAR_UUID_MV "6ebe8ad1-ab57-4f57-bf64-fd9ce197d9c4"

BLECharacteristic *pWeatherDataChar;
BLECharacteristic *pEnergyDataChar;
BLECharacteristic *pMvDataChar;

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

float wattHoursCharge = 0;
float wattHoursDischarge = 0;
unsigned long lastADCRead = 0;
uint8_t mVSetting = 1;

class BaseBLEServerCallbacks : public BLEServerCallbacks
// Callback triggered when a client device connects or disconnects
{
  void onConnect(BLEServer *pServer)
  {
    Serial.println("Device connected");
  }

  void onDisconnect(BLEServer *pServer)
  {
    // Restart advertising
    Serial.println("Device disconnected");
    BLEAdvertising *pAdvertising = pServer->getAdvertising();
    if (pAdvertising)
    {
      pAdvertising->start();
    }
  }
};

// Got a new mV setting and/or reset request
class mvCallback : public BLECharacteristicCallbacks
{
  void onWrite(BLECharacteristic *pCharacteristic)
  {
    std::string value = pCharacteristic->getValue();
    uint16_t newMV = (value[1] << 8) | value[0];
    uint16_t reset = (value[3] << 8) | value[2];
    if (newMV != mVSetting)
    {
      Serial.print("Setting mV to: ");
      Serial.println(newMV);
      mVSetting = newMV;
      EEPROM.write(0, mVSetting);
      EEPROM.commit();
    }
    if (reset > 0)
    {
      Serial.println("Resetting watt hours");
      wattHoursCharge = 0;
      wattHoursDischarge = 0;
    }
  }
};

void setup()
{
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

  EEPROM.begin(1); // Initialize EEPROM 1 bytes
  uint8_t eepromValue = EEPROM.read(0);
  if (eepromValue > 2)
  {
    // Default to 75mv if no value
    mVSetting = 1;
  }
  else
  {
    mVSetting = eepromValue;
  }

  lastADCRead = millis();

  // Create BLE server, and characteristics
  BLEDevice::init(DEVICE_NAME);

  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new BaseBLEServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pEnergyDataChar = pService->createCharacteristic(
      CHAR_UUID_ENERGY_DATA,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  pEnergyDataChar->addDescriptor(new BLE2902());

  pWeatherDataChar = pService->createCharacteristic(
      CHAR_UUID_WEATHER_DATA,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  pWeatherDataChar->addDescriptor(new BLE2902());

  pMvDataChar = pService->createCharacteristic(
      CHAR_UUID_MV,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pMvDataChar->addDescriptor(new BLE2902());
  pMvDataChar->setCallbacks(new mvCallback());
  pMvDataChar->setValue(&mVSetting, mVSetting);

  // Start BLE server and advertising
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("BLE device is ready to be connected");
}

void loop()
{

  struct WeatherData
  {
    float temperature;
    float humidity;
    float pressure;
    float altitude;
  };

  struct EnergyData
  {
    float volts;
    float amps;
    float wattHoursIn;
    float wattHoursOut;
  };

  WeatherData weather;
  EnergyData energyData;

  int notifyDelay = 500;
  float temp = 0;
  float tempCount = 0;

#ifdef BMP
  temp += bmp.readTemperature();
  tempCount++;
  weather.pressure = bmp.readPressure();
  weather.altitude = bmp.readAltitude() * 3.28084;
#endif

#ifdef BMP280
  temp += bmp280.readTemperature();
  tempCount++;
  weather.pressure = bmp280.readPressure();
  weather.altitude = bmp280.readAltitude() * 3.28084;

  Serial.print("Altitude: ");
  Serial.println(weather.altitude);
  Serial.print("Pressure: ");
  Serial.println(weather.pressure);
#endif

#ifdef AHT2x
  if (aht20.available() == true)
  {
    // Get the new temperature and humidity value
    temp += aht20.getTemperature();
    tempCount++;
    weather.humidity = aht20.getHumidity();

    Serial.print("Humidity: ");
    Serial.println(weather.humidity);

    // The AHT20 can respond with a reading every ~50ms. However, increased read time can cause the IC to heat around 1.0C above ambient.
    // The datasheet recommends reading every 2 seconds.
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
  int R2 = 5100;

  // https://ohmslawcalculator.com/voltage-divider-calculator
  float vbat = ((R1 + R2) * adcVolts) / R2;
  energyData.volts = vbat;
  Serial.print("Voltage: ");
  Serial.println(vbat);

  // Differential shunt current
  // https://learnarduinonow.com/2015/05/11/reading-current-shunt-with-arduino.html
  int16_t results;
  ADS.setGain(16);
  unsigned long currentTime = millis();
  results = ADS.readADC_Differential_2_3();
  unsigned long delta = currentTime - lastADCRead;
  lastADCRead = millis();

  float amps = ((float)results * 256.0) / 32768.0; // 100mv shunt
  if (mVSetting == 1)
  {
    amps = amps * 1.333; // 75mv shunt
  }
  if (mVSetting == 0)
  {
    amps = amps * 2; // 50mv shunt
  }
  energyData.amps = amps;
  Serial.print("Amps: ");
  Serial.println(amps);

  float power = amps * vbat;
  float energy = (power * delta) / (3600.0 * 1000.0); // Convert milliseconds to hours

  if (energy < 0)
  {
    wattHoursCharge += energy * -1.0;
  }
  else
  {
    wattHoursDischarge += energy;
  }

  Serial.print("Watt Hours In: ");
  Serial.println(wattHoursCharge);
  energyData.wattHoursIn = wattHoursCharge;

  Serial.print("Watt Hours Out: ");
  Serial.println(wattHoursDischarge);
  energyData.wattHoursOut = wattHoursDischarge;
#endif

  // Average temp of all sensors
  if (tempCount > 0)
  {
    weather.temperature = temp / tempCount;
    Serial.print("Temp: ");
    Serial.println(weather.temperature);
  }

  // Pack the data into a byte array
  uint8_t weatherDataBytes[sizeof(WeatherData)];
  memcpy(weatherDataBytes, &weather, sizeof(WeatherData));
  pWeatherDataChar->setValue(weatherDataBytes, sizeof(WeatherData));
  pWeatherDataChar->notify();

  uint8_t energyDataBytes[sizeof(EnergyData)];
  memcpy(energyDataBytes, &energyData, sizeof(EnergyData));
  pEnergyDataChar->setValue(energyDataBytes, sizeof(EnergyData));
  pEnergyDataChar->notify();

  delay(1500);
}