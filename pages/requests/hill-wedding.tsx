import { useEffect } from "react";
import Head from "next/head";

const RedirectPage: React.FC = () => {
  useEffect(() => {
    // Replace 'YOUR_SPOTIFY_PLAYLIST_URL' with your actual Spotify collaborative playlist URL
    const spotifyPlaylistUrl =
      "https://open.spotify.com/playlist/5aHzp5WJjcStcPqNuSAncK?si=20b1fe44a4684a9f&pt=a07c3fd5b837e5add53adbd1f5adaa53";

    // Redirect to the Spotify playlist URL
    window.location.href = spotifyPlaylistUrl;
  }, []);

  return (
    <div>
      {/* Your page content goes here */}
      <Head>
        {/* Add OG image meta tags */}
        <meta property="og:image" content="/weddings/hill.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:description"
          content="Calling all music enthusiasts and dancefloor divas – get ready to be part of the hottest wedding dance experience ever! 🎉🕺💃 We're putting the power of music selection in your hands, so you can help curate the soundtrack for an unforgettable night of celebration!  Derek + Blaire"
        />
      </Head>
    </div>
  );
};

export default RedirectPage;
