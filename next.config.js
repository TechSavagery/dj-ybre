/** @type {import('next').NextConfig} */
module.exports = {
  async redirects() {
    return [
      {
        source: '/spotify',
        destination: 'https://open.spotify.com/user/1225398661/playlists',
        permanent: false,
        basePath: false
      },
      {
        source: '/mixcloud',
        destination: 'https://www.mixcloud.com/ladell-erby',
        permanent: false,
        basePath: false
      },
    ]
  },
  reactStrictMode: true,
}
