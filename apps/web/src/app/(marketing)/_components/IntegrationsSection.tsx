import Link from 'next/link'
import { ArrowRight, CreditCard, Smartphone, MessageSquare, Video, Shield, Globe, Mail, Zap, Wifi } from 'lucide-react'

const integrations = [
  { name: 'MTN MoMo',          desc: 'Mobile money payments',    icon: Smartphone  },
  { name: 'Orange Money',      desc: 'Francophone Africa',       icon: Smartphone  },
  { name: 'Paystack',          desc: 'Cards + bank transfers',   icon: CreditCard  },
  { name: 'Flutterwave',       desc: 'Pan-African payments',     icon: CreditCard  },
  { name: 'WhatsApp Business', desc: 'Notifications + chatbot',  icon: MessageSquare },
  { name: "Africa's Talking",  desc: 'SMS to 40+ networks',      icon: Zap         },
  { name: 'Google Workspace',  desc: 'SSO + Calendar sync',      icon: Globe       },
  { name: 'Microsoft 365',     desc: 'SSO + Teams',              icon: Globe       },
  { name: 'LiveKit',           desc: 'Built-in live classes',    icon: Video       },
  { name: 'Cloudflare',        desc: 'CDN + security',           icon: Shield      },
  { name: 'Stripe',            desc: 'International payments',   icon: CreditCard  },
  { name: 'Resend',            desc: 'Transactional email',      icon: Mail        },
]

export default function IntegrationsSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6">

        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/50 rounded-full px-4 py-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium mb-6">
            <Wifi className="w-3.5 h-3.5" />
            Integrations
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Connects with the tools you already use</h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
            Tera SM plugs into the payment rails, communication channels, and identity providers
            your school and students depend on every day.
          </p>
        </div>

        {/* Integration grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
          {integrations.map(({ name, desc, icon: Icon }) => (
            <div
              key={name}
              className="group border border-gray-100 dark:border-blue-900/40 rounded-2xl p-4 flex flex-col items-center text-center hover:border-blue-200 dark:hover:border-blue-700/60 hover:shadow-md transition-all cursor-default"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-700 transition-all">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight mb-1">{name}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gray-50 dark:bg-blue-950/30 border border-gray-100 dark:border-blue-900/40 rounded-2xl px-7 py-5">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">More integrations on the way</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Flutterwave, Jitsi, Twilio, AEBS, and more. Have a specific request?</p>
          </div>
          <Link
            href="/integrations"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 transition-colors flex-shrink-0"
          >
            View all integrations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
