import React from 'react'
import styles from "./Timer.module.scss"
import { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/context'
 
export default function Timer() {
  const {username} = useContext(UserContext)
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const countdown = setInterval(() => {
      if (seconds > 0) {
        setSeconds(prevSeconds => prevSeconds - 1);
      }
    }, 1000);

    return () => clearInterval(countdown);
  }, [seconds]);

  return (
    <div className={`${styles.Timer}`}>
      <div className='d-flex center'>

      </div>
      <p> Es-tu prêt {username} ? 
      </p>
      {seconds > 0 ? (
        <p>{seconds}</p>
      ) : (
        <p>C'est PARTI</p>
      )}
    </div>
  );
}
