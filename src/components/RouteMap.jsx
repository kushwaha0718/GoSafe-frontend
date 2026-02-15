import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const createCustomIcon = (color, label) => L.divIcon({
  className: '',
  html: `
    <div style="
      background: ${color};
      color: #0a0c0f;
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 3px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      letter-spacing: 0.05em;
    ">${label}</div>
  `,
  iconAnchor: [0, 0],
})

const createUserIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="position:relative; width:20px; height:20px;">
      <div style="
        position:absolute; inset:0;
        border-radius: 50%;
        background: rgba(0, 157, 255, 0.15);
        border: 2px solid rgba(0, 157, 255, 0.4);
        animation: none;
      "></div>
      <div style="
        position:absolute;
        top:50%; left:50%;
        transform: translate(-50%,-50%);
        width: 10px; height: 10px;
        background: #009dff;
        border-radius: 50%;
        border: 2px solid #0a0c0f;
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const createShopIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="
      width: 10px; height: 10px;
      background: #ffb800;
      border-radius: 50%;
      border: 2px solid #0a0c0f;
      box-shadow: 0 0 6px rgba(255,184,0,0.5);
    "></div>
  `,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})

// Component to fit bounds when route changes
function FitBounds({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [coords, map])
  return null
}

// Component to pan to user location
function PanToUser({ userLocation }) {
  const map = useMap()
  useEffect(() => {
    if (userLocation) {
      map.panTo([userLocation.lat, userLocation.lng], { animate: true })
    }
  }, [userLocation, map])
  return null
}

export default function RouteMap({ route, userLocation, tracking }) {
  const routeCoords = route.waypoints?.map(wp => [wp.lat, wp.lng]) || []

  // Default center fallback
  const center = routeCoords.length > 0
    ? routeCoords[Math.floor(routeCoords.length / 2)]
    : [28.6139, 77.2090] // Default: New Delhi

  const safety = route.safetyScore >= 80 ? '#009dff' :
                 route.safetyScore >= 60 ? '#ffb800' : '#ff3d3d'

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Fit bounds to route */}
      {routeCoords.length > 0 && <FitBounds coords={routeCoords} />}

      {/* Pan to user when tracking */}
      {userLocation && <PanToUser userLocation={userLocation} />}

      {/* Route polyline - shadow */}
      {routeCoords.length > 1 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: 'rgba(0,0,0,0.3)',
            weight: 8,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* Route polyline - main */}
      {routeCoords.length > 1 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: safety,
            weight: 4,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* Origin Marker */}
      {routeCoords.length > 0 && (
        <Marker
          position={routeCoords[0]}
          icon={createCustomIcon('#009dff', 'ORIGIN')}
        >
          <Popup>
            <strong style={{ color: '#009dff' }}>{route.originStation || 'Origin'}</strong>
          </Popup>
        </Marker>
      )}

      {/* Destination Marker */}
      {routeCoords.length > 1 && (
        <Marker
          position={routeCoords[routeCoords.length - 1]}
          icon={createCustomIcon('#ffb800', 'DEST')}
        >
          <Popup>
            <strong style={{ color: '#ffb800' }}>{route.destStation || 'Destination'}</strong>
          </Popup>
        </Marker>
      )}

      {/* Intermediate stop markers */}
      {route.stops && route.stops.map((stop, i) => (
        <Marker
          key={i}
          position={[stop.lat, stop.lng]}
          icon={L.divIcon({
            className: '',
            html: `<div style="
              width:10px; height:10px;
              background: var(--bg-elevated, #1a1e26);
              border: 2px solid ${safety};
              border-radius: 50%;
            "></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })}
        >
          <Popup>{stop.name}</Popup>
        </Marker>
      ))}

      {/* Shop markers */}
      {route.shops && route.shops.map((shop, i) => (
        <Marker
          key={`shop-${i}`}
          position={[shop.lat, shop.lng]}
          icon={createShopIcon()}
        >
          <Popup>
            <div>
              <strong>{shop.name}</strong>
              <br />
              <small style={{ color: '#ffb800' }}>{shop.category}</small>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* User Location */}
      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={userLocation.accuracy || 50}
            pathOptions={{
              color: '#009dff',
              fillColor: '#009dff',
              fillOpacity: 0.08,
              weight: 1,
              dashArray: '4 4',
            }}
          />
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserIcon()}
          >
            <Popup>Your live location</Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  )
}
