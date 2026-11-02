import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {OverviewPane} from './desk/overview'
import {schemaTypes} from './schemaTypes'
import {resolve} from './presentation/resolve'
import './studio.css'

// Minimal ambient typing so `process.env.SANITY_STUDIO_*` type-checks without
// requiring @types/node to be resolvable. Module-scoped, so it shadows (and never
// conflicts with) the global `process`; Sanity injects these values at build time.
declare const process: {env: Record<string, string | undefined>}

export default defineConfig({
  name: 'default',
  title: 'DAR AL-AUMARA',
  basePath: '/studio',

  projectId: 'xvmhw7dr',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) => S.list().title('DAR AL-AUMARA').items([
        S.listItem().id('overview').title('Overview').child(
          S.component().title('Overview').component(OverviewPane),
        ),
        S.divider(),
        S.documentTypeListItem('product').title('Products'),
        S.documentTypeListItem('order').title('Orders'),
        S.documentTypeListItem('customer').title('Customers'),
        S.documentTypeListItem('campaign').title('Marketing'),
        S.divider(),
        S.documentTypeListItem('brand').title('Brands'),
        S.documentTypeListItem('category').title('Categories'),
      ]),
    }),
    visionTool(),
    // Presentation gives the standalone Studio a live preview of the sibling
    // Next.js storefront with click-to-edit. The origin is the deployed (or
    // local) web app; previewMode enables Next Draft Mode on the frontend.
    presentationTool({
      resolve,
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3000',
        previewMode: {
          enable: '/draft-mode/enable',
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
