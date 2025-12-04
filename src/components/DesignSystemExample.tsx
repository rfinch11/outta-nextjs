/**
 * Design System Color Examples
 *
 * This component demonstrates how to use the new design system color scales.
 * You can view this at /prototypes to see all colors in action.
 */

import { colorScales } from '@/lib/design-system-colors';

export default function DesignSystemExample() {
  const scales = Object.keys(colorScales) as Array<keyof typeof colorScales>;
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

  return (
    <div className="p-8 space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-black-900 mb-2">
          Outta Design System Colors
        </h1>
        <p className="text-black-600 mb-8">
          Complete color scales for the Outta brand
        </p>
      </div>

      {/* Legacy Colors Comparison */}
      <section>
        <h2 className="text-2xl font-bold text-black-800 mb-4">
          Legacy → New Mapping
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-black-200">
            <div className="w-full h-16 bg-outta-yellow rounded mb-2" />
            <p className="text-sm font-mono text-black-600">
              outta-yellow
            </p>
            <div className="w-full h-16 bg-broom-400 rounded mt-2" />
            <p className="text-sm font-mono text-black-900">
              broom-400 (new)
            </p>
          </div>

          <div className="p-4 rounded-lg border border-black-200">
            <div className="w-full h-16 bg-outta-orange rounded mb-2" />
            <p className="text-sm font-mono text-black-600">
              outta-orange
            </p>
            <div className="w-full h-16 bg-flamenco-500 rounded mt-2" />
            <p className="text-sm font-mono text-black-900">
              flamenco-500 (new)
            </p>
          </div>

          <div className="p-4 rounded-lg border border-black-200">
            <div className="w-full h-16 bg-outta-green rounded mb-2" />
            <p className="text-sm font-mono text-black-600">
              outta-green
            </p>
            <div className="w-full h-16 bg-emerald-500 rounded mt-2" />
            <p className="text-sm font-mono text-black-900">
              emerald-500 (new)
            </p>
          </div>
        </div>
      </section>

      {/* All Color Scales */}
      {scales.map((scaleName) => (
        <section key={scaleName}>
          <h2 className="text-2xl font-bold text-black-800 mb-4 capitalize">
            {scaleName.replace(/([A-Z])/g, ' $1').trim()}
          </h2>
          <div className="grid grid-cols-11 gap-2">
            {shades.map((shade) => {
              const colorValue = colorScales[scaleName][shade];
              return (
                <div key={shade} className="space-y-2">
                  <div
                    className="w-full h-20 rounded-lg shadow-sm"
                    style={{ backgroundColor: colorValue }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-black-900">
                      {shade}
                    </p>
                    <p className="text-xs font-mono text-black-500">
                      {colorValue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Usage Examples */}
      <section>
        <h2 className="text-2xl font-bold text-black-800 mb-4">
          Usage Examples
        </h2>

        <div className="space-y-6">
          {/* Buttons */}
          <div>
            <h3 className="text-lg font-semibold text-black-700 mb-3">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-broom-400 hover:bg-broom-500 text-black-900 font-semibold rounded-lg transition-colors">
                Primary (Broom)
              </button>
              <button className="px-6 py-3 bg-flamenco-500 hover:bg-flamenco-600 text-white font-semibold rounded-lg transition-colors">
                Secondary (Flamenco)
              </button>
              <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors">
                Success (Emerald)
              </button>
              <button className="px-6 py-3 bg-lavender-magenta-500 hover:bg-lavender-magenta-600 text-white font-semibold rounded-lg transition-colors">
                Premium (Lavender Magenta)
              </button>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h3 className="text-lg font-semibold text-black-700 mb-3">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-broom-50 border border-broom-200 rounded-lg">
                <h4 className="text-lg font-bold text-broom-900 mb-2">
                  Broom Card
                </h4>
                <p className="text-broom-700">
                  Light background with darker text using broom scale
                </p>
              </div>
              <div className="p-6 bg-malibu-50 border border-malibu-200 rounded-lg">
                <h4 className="text-lg font-bold text-malibu-900 mb-2">
                  Malibu Card
                </h4>
                <p className="text-malibu-700">
                  Light background with darker text using malibu scale
                </p>
              </div>
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="text-lg font-bold text-emerald-900 mb-2">
                  Emerald Card
                </h4>
                <p className="text-emerald-700">
                  Light background with darker text using emerald scale
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h3 className="text-lg font-semibold text-black-700 mb-3">Alerts</h3>
            <div className="space-y-3">
              <div className="p-4 bg-broom-100 border-l-4 border-broom-500 rounded">
                <p className="text-broom-900 font-semibold">Info Alert</p>
                <p className="text-broom-700">Using broom scale for informational messages</p>
              </div>
              <div className="p-4 bg-emerald-100 border-l-4 border-emerald-500 rounded">
                <p className="text-emerald-900 font-semibold">Success Alert</p>
                <p className="text-emerald-700">Using emerald scale for success messages</p>
              </div>
              <div className="p-4 bg-flamenco-100 border-l-4 border-flamenco-500 rounded">
                <p className="text-flamenco-900 font-semibold">Warning Alert</p>
                <p className="text-flamenco-700">Using flamenco scale for warnings</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
