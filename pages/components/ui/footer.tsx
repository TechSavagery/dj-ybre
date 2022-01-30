const footerNavigation = {
  social: [
    {
      name: 'MixCloud',
      href: 'https://www.mixcloud.com/ladell-erby/',
      icon: (props: any) => (
        <img src="https://img.icons8.com/windows/35/ffffff/mixcloud.png" />
      ),
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/djybre/',
      icon: (props: any) => (
        <img src="https://img.icons8.com/ios-filled/35/ffffff/instagram-new--v1.png" />
      ),
    },
    {
      name: 'Spotify',
      href: 'https://open.spotify.com/user/1225398661/playlists',
      icon: (props: any) => (
        <img src="https://img.icons8.com/ios-filled/35/ffffff/spotify.png" />
      ),
    },
    {
      name: 'Contact',
      href: '/contact.html',
      icon: (props: any) => (
        <img src="https://img.icons8.com/ios-filled/35/ffffff/zoom.png" />
      ),
    },
  ],
};
export default function Footer() {
  return (
    <footer className="mt-24 bg-stone-900 sm:mt-12">
      <div className="mx-auto max-w-md py-12 px-4 overflow-hidden sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="mt-8 flex justify-center space-x-6">
          {footerNavigation.social.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-gray-400 hover:text-gray-300"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </a>
          ))}
        </div>
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; {new Date().getFullYear()} DJ YBRE, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
