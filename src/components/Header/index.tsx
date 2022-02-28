import { ReactElement } from 'react';
import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): ReactElement {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.image}>
          <Link href="/">
            <a>
              <img src="/logo.svg" alt="logo" />
            </a>
          </Link>
        </div>
      </header>
    </>
  );
}
