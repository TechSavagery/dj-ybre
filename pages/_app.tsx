import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css"></link>{' '}
        <title>DJ YBRE</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
