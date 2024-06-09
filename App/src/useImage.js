import { useState, useEffect } from "react";

// import image1 from "./assets/camp1.jpg";
import image2 from "../assets/camp2.jpg";
import image3 from "../assets/camp3.jpg";
import image4 from "../assets/camp4.jpg";
// import image5 from "./assets/camp5.jpg";

const ROTATION_INTERVAL = 30000;
const IMAGES = [image2, image3, image4];

export default function useImage() {
  const [image, setImage] = useState(IMAGES[0]);

  const rotateImage = () => {
    setImage(IMAGES[Math.floor(Math.random() * IMAGES.length)]);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      rotateImage();
    }, ROTATION_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  return { image, rotateImage };
}
