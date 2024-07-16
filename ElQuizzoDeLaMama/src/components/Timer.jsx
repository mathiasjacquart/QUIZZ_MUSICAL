import React, { useContext, useState, useEffect } from 'react';
import styles from "./Timer.module.scss";
import { UserContext } from '../context/context';
import { useNavigate } from "react-router-dom";

export default function Timer() {
  const { username } = useContext(UserContext);
  const [seconds, setSeconds] = useState(5);
  const navigate = useNavigate(); // Assurez-vous que le hook useNavigate est utilisé correctement

  useEffect(() => {
    if (seconds > 0) {
      const countdown = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      // Naviguer vers la nouvelle page lorsque le timer atteint zéro
      navigate("/quizz");
    }
  }, [seconds, navigate]); // Ajoutez navigate aux dépendances pour éviter les avertissements de dépendance manquante

  return (
    <div className={styles.Timer}>
      <div className={styles.center}>
        <span>Es-tu prêt {username} ? </span>
        {seconds > 0 ? (
          <span>{seconds}</span>
        ) : (
          <span>C'est PARTI</span>
        )}
      </div>
    </div>
  );
}
