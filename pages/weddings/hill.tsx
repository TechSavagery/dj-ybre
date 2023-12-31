// Import the Head component from Next.js
import Head from 'next/head';

const MusicPage = () => {
  // URL details
  const siteTitle = "Blaire & Derek Hill - Father Daughter Dance";
  const mp3Url = "/weddings/hill/father-daughter-dance.mp3"; // Change to your MP3 file URL
  const ogImageUrl = "/weddings/hill/hill-2.png"; // Change to your desired OG image URL

  return (
    <>
      <Head>
        {/* Standard Meta Tags */}
        <title>{siteTitle}</title>
        <meta name="description" content="Listen to our latest song!" />

        {/* Open Graph / Facebook Meta Tags */}
        <meta property="og:type" content="music.song" />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content="Listen to our latest song!" />
        <meta property="og:url" content={mp3Url} />
        <meta property="og:image" content={ogImageUrl} />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content="Listen to our latest song!" />
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>
      
      {/* Your page content */}
      <div>
        <audio controls>
          <source src={mp3Url} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
        {/* ... other content ... */}
      </div>
    </>
  );
};

export default MusicPage;
