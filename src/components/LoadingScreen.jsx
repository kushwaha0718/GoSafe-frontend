import styles from './LoadingScreen.module.css'

export default function LoadingScreen() {
  return (
    <div className={styles.wrap}>
      <div className={styles.logo}>
        <span className={styles.icon}>◈</span>
        <span className={styles.text}>GOSAFE</span>
      </div>
      <div className={styles.dots}>
        {[0,1,2].map(i => <span key={i} className={styles.dot} style={{animationDelay:`${i*0.2}s`}} />)}
      </div>
    </div>
  )
}
