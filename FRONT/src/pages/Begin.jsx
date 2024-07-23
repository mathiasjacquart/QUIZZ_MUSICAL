import React, { useContext, useState } from 'react';
import { UserContext } from '../context/context';
import { useNavigate } from "react-router-dom";
import styles from "./Begin.module.scss"

export default function Begin() {
  const navigate = useNavigate();
  const { setUsername } = useContext(UserContext);

  const [message, setMessage] = useState("")
  const handleSubmit = (event) => {
    event.preventDefault();
    if (event.target.elements.username.value === "") {
     setMessage("Veuillez entrer un pseudo tout d'abord")
    } 
    else {
      setUsername(event.target.elements.username.value);
      navigate("/lobby");
    }

  };

  return (
    <div className='mwFull mhFull d-flex justify-content-center align-items-center'>
      <div className={`${styles.Begin}`}>
        <h1>Bienvenue à l'Examen Aveugle</h1>
        <div className={styles.container}>
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Choisis ton pseudo :</label>
            <input id="username" type="text" placeholder="oui, oui, t'as bien lu, ton pseudo." />
            <div className={styles.message} >{message && <p style={{color:"rgb(179, 0, 0);"}}>{message}</p>}</div>
            <div className='d-flex justify-content-center'>
              <button className='btn-primary' type='submit'>C'est parti les poupis !</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
