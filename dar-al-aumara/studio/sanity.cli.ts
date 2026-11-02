import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'xvmhw7dr',
    dataset: 'production'
  },
  typegen: {
    enabled: true,
    // Scan GROQ queries in the sibling Next.js app...
    path: '../web/src/**/*.{ts,tsx,js,jsx}',
    // ...against the extracted schema...
    schema: 'schema.json',
    // ...and emit generated types back into the web app.
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
