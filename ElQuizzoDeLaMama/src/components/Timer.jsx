import React, { useContext, useState, useEffect } from 'react';
import styles from "./Timer.module.scss";
import { UserContext } from '../context/context';
import { useNavigate } from "react-router-dom";
import Meme from "../assets/images/whatever.gif";

export default function Timer() {
  const { username } = useContext(UserContext);
  const [seconds, setSeconds] = useState(5);
  const [showReady, setShowReady] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showReStart, setShowReStart] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show "Es-tu prêt?" for 1 second
    const readyTimer = setTimeout(() => {
      setShowReady(false);
      setShowCountdown(true);
    }, 1000);

    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (showCountdown && seconds > 0) {
      const countdown = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (seconds === 0) {
      setShowCountdown(false);
      setShowStart(true);
      const startTimer = setTimeout(() => {
        setShowStart(false);
        setShowImage(true);
        const imageTimer = setTimeout(() => {
          navigate("/quizz");
        }, 3000);
        return () => clearTimeout(imageTimer);
      }, 2000); // Show "C'est parti!" for 2 seconds
      return () => clearTimeout(startTimer);
    }
  }, [showCountdown, seconds, navigate]);

  return (
    <div className={styles.Timer}>
      <div className={styles.center}>
        {showReady && <div className={styles.ready}>T'es prêt {username} ?</div>}
        {showCountdown && <div className={styles.compteur}>{seconds}</div>}
        {showStart && <div className={styles.start}>C'EST PARTI !</div>}
        {showImage && <img className={styles.troll}src={Meme} alt="Troll Image" />}
      </div>
    </div>
  );
}
