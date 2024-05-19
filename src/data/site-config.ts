export type Image = {
  src: string
  alt?: string
  caption?: string
}

export type Link = {
  text: string
  href: string
}

export type Hero = {
  title?: string
  text?: string
  image?: Image
  actions?: Link[]
}

export type Subscribe = {
  title?: string
  text?: string
  formUrl: string
}

export type SiteConfig = {
  logo?: Image
  title: string
  subtitle?: string
  description: string
  image?: Image
  headerNavLinks?: Link[]
  footerNavLinks?: Link[]
  socialLinks?: Link[]
  hero?: Hero
  subscribe?: Subscribe
  postsPerPage?: number
  projectsPerPage?: number
}

const siteConfig: SiteConfig = {
  title: 'CJ Ting',
  subtitle: '',
  description: "CJ Ting's blog",
  image: {
    src: '/avatar.jpeg',
    alt: "CJ Ting's blog",
  },
  headerNavLinks: [
    {
      text: 'Home',
      href: '/',
    },
    {
      text: 'Archive',
      href: '/archive/',
    },
  ],
  footerNavLinks: [],
  socialLinks: [
    {
      text: 'GitHub',
      href: 'https://github.com/cj1128',
    },
    {
      text: 'Twitter',
      href: 'https://twitter.com/symbolnotfound',
    },
  ],
  hero: {
    title: 'Full-stack developer. "What I can not create, I do not understand".',
    text: "I'm **CJ Ting**, a passionate full-stack developer based in Japan, who finds immense joy in unraveling the fundamental principles behind technologies.",
    image: {
      src: '/avatar.jpeg',
      alt: "CJ Ting's avatar, smile Luffy",
    },
    actions: [
      // {
      //     text: 'Get in Touch',
      //     href: '/contact',
      // },
    ],
  },
  subscribe: {
    title: 'Subscribe to Dante Newsletter',
    text: 'One update per week. All the latest posts directly in your inbox.',
    formUrl: '#',
  },
  postsPerPage: 100,
  projectsPerPage: 8,
}

export default siteConfig
