import React, { useContext } from 'react';
import { UserContext } from '../context/context';
import Timer from '../components/Timer';
import { useNavigate } from "react-router-dom";
import styles from "./Begin.module.scss"

export default function Begin() {
  const navigate = useNavigate();
  const { setUsername } = useContext(UserContext);
  console.log(setUsername);
  

  const handleSubmit = (event) => {
    event.preventDefault();
    setUsername(event.target.elements.username.value);
    navigate("/countdown");
  };

  return (
    <div className='mwFull mhFull d-flex justify-content-center align-items-center'>
      <div className={`${styles.Begin}`}>
        <h1>Bienvenue sur Quizzical</h1>
        <div className={``}>
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Choisis ton pseudo:</label>
            <input id="username" type="text" />
            <div className='d-flex justify-content-center'>
              <button className='btn-primary' type='submit'>C'est parti les poupis</button>
            </div>

          </form>
        </div>
        {/* <Timer /> */}
      </div>
    </div>
  );
}
