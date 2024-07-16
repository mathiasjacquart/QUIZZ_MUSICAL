import React from 'react';
import  styles from './Background.module.scss'; 

export default function Background() {
  return (
    <div className={`${styles.background}`}>
      <div className={`${styles.body}`}></div>
      <div className={`${styles.head}`}></div>
    </div>
  );
}
