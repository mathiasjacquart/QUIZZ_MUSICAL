import React from 'react'
import style from "./Begin.module.scss"

export default function Begin() {
  return (
    <div className=' mwFull mhFull d-flex justify-content-center align-items-center'>
        <div className={`d-flex flex-column ${
            style.Begin
        }`}>
          <h1>Bienvenue sur Quizzical</h1>
          <div className={`${style.Formulaire}`}>
            <form className={`d-flex flex-column  `}action="">
              <label htmlFor="">Choisis ton blaze : </label>
              <input type="text" />
              <div className=' d-flex center'>
              <button > C'est parti les poupis</button>
              </div>
              
            </form>
          </div>

        </div>
    </div>
  )
}
