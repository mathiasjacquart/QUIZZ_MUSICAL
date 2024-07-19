<div className={styles.Quiz}>

<div className={styles.center}>

  {prepSeconds > 0 ? (
    <>
      <p>Préparez-vous</p>
      <p>{prepSeconds}</p>
    </>
  ) : (
    <>
      {songSeconds > 0 ? (
        <>
          {currentTrack && (


          )}
          <form onSubmit={handleSubmit}>
            <label htmlFor="Answer">Saisissez l'artiste ou le titre de la chanson :</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Entrez l'artiste ou le titre"
            />
            <button className='btn-primary' type="submit">Envoyer</button>
          </form>
          <div className={styles.message}>{message && <p>{message}</p>}</div>
        </>
      ) : (
        <>
          {round <= 10 ? (
            <>

            <p className={styles.nextRound}>Manche suivante dans quelques secondes...</p>
            </>
          ) : (
            <div>
              <p className={styles.endQuizz}>Quiz terminé! </p>
              <p className={styles.endQuizz}>Vous avez accumulé un total de {points} points.</p>
              {gameOver  (

              )}
            </div>
          )}
        </>
      )}
    </>
  )}
</div>
</div>