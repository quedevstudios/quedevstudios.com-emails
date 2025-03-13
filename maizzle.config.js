/*
|-------------------------------------------------------------------------------
| Development config                      https://maizzle.com/docs/environments
|-------------------------------------------------------------------------------
|
| This is the base configuration that Maizzle will use when you run commands
| like `npm run build` or `npm run dev`. Additional config files will
| inherit these settings, and can override them when necessary.
|
*/

/** @type {import('@maizzle/framework').Config} */
export default {
  dist: {
    path: "dist",
  },
  build: {
    content: ["emails/**/*.html"],
    output: {
      path: "build",
    },
    static: {
      source: ["images/**/*.*"],
      destination: "images",
    },
  },
  locals: {
    company: {
      logo: "https://quedevstudios.com/assets/logo.svg",
      name: "QueDev Studios",
      address: "123 Main St",
      city: "Daytona Beach",
      state: "FL",
      zip: "35501",
      phone: "+1 (555) 555-5555",
      email: "support@quedevstudios.com",
      website: "https://quedevstudios.com",
      socials: {
        facebook: {
          name: "Facebook",
          url: "https://facebook.com/quedevstudios",
          icon: "ti-brand-facebook-filled",
        },
      },
    },
  },
};
