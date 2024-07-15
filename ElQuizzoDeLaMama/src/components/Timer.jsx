import React from 'react'
import styles from "./Timer.module.scss"
 
export default function Timer() {
  return (
<div className={`${styles.Timer}`}>
  <span>Es-tu prêt Michel ?</span>

  <span>5</span>
  <span>4</span>
  <span>3</span>
  <span>2</span>
  <span>1</span>
  <span>C'est PARTI</span>
</div>
  )
}
