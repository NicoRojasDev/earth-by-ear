// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Map view: real EIC frame image + canvas overlay (glows, flashes, Explore cursor) + geography helpers.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const RAD = Math.PI / 180;

  // ---------- geography ----------
  function haversineKm(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function bearing(lat1, lon1, lat2, lon2) {
    const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
    const x = Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) - Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
    return Math.atan2(y, x); // radians, 0 = north, clockwise
  }
  function dir8(rad) {
    const k = Math.round(((rad / RAD) + 360) % 360 / 45) % 8;
    return EBE.i18n.t('dir.' + ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'][k]);
  }

  // Coarse named regions (first match wins). [lonMin, lonMax, latMin, latMax, en, es]
  const LAND = [
    [-65.2, -61.7, -30.4, -25.6, 'Santiago del Estero, Argentina', 'Santiago del Estero, Argentina'],
    [-66, -57, -28, -18, 'the Gran Chaco', 'el Gran Chaco'],
    [-75, -48, -15, 5, 'the Amazon', 'la Amazonia'],
    [-74, -53, -56, -22, 'Argentina', 'Argentina'],
    [-82, -34, -56, 13, 'South America', 'Sudamérica'],
    [-92, -59, 7, 23, 'Central America and the Caribbean', 'Centroamérica y el Caribe'],
    [-118, -86, 14, 33, 'Mexico', 'México'],
    [-125, -66, 24, 50, 'the United States', 'Estados Unidos'],
    [-170, -129, 51, 72, 'Alaska', 'Alaska'],
    [-141, -52, 42, 84, 'Canada', 'Canadá'],
    [-73, -11, 59, 84, 'Greenland', 'Groenlandia'],
    [-11, 40, 35, 71, 'Europe', 'Europa'],
    [-17, 35, 15, 32, 'the Sahara', 'el Sahara'],
    [-18, 40, 4, 15, 'the Sahel and Central Africa', 'el Sahel y África central'],
    [10, 42, -35, 4, 'southern Africa', 'el sur de África'],
    [-18, 52, -35, 37, 'Africa', 'África'],
    [34, 63, 12, 42, 'the Middle East', 'Medio Oriente'],
    [68, 90, 6, 36, 'India and South Asia', 'India y el sur de Asia'],
    [90, 141, -11, 25, 'Southeast Asia', 'el Sudeste Asiático'],
    [129, 146, 30, 46, 'Japan', 'Japón'],
    [73, 135, 18, 54, 'China and East Asia', 'China y el este de Asia'],
    [60, 180, 50, 78, 'Siberia', 'Siberia'],
    [46, 90, 35, 55, 'Central Asia', 'Asia central'],
    [112, 155, -44, -10, 'Australia', 'Australia'],
    [165, 180, -48, -33, 'New Zealand', 'Nueva Zelanda'],
    [26, 60, 50, 72, 'Russia', 'Rusia']
  ];
  // Land/sea mask on a 1-degree grid (360 x 180 bits, row-major from 90N 180W), derived from the
  // base map of NASA SVS 5113 (navy = ocean). Used only to name places.
  const LAND_MASK_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAAAAE//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///8eP////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////////////+AAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////wAAAAASAAABQdmAAAAPwAAAAAAAAAAAAAAAAAAAAAAAAAGA////j///////+AAAAB//4AAAAAAAAAAP9gAAAAAAAAAAAAAAAAAAAAAAAeH7v//5////////8AAAAB/+AAAAAAAAAAAA/4AAAAAAAAAAAAAAAAAAAAAAdcIJxP/g////////+AAAAAPnAAAAAAAAAAAAB8AAAAAAAAAAAAAAAAAAAAAD/jD////AP////////AAAAACAAAAAAAf4AAAD//+AAAAAAAAAAAAAAAAAAAAAf/9///8AAAf//////AAAAAAAAAAAAH+AAAD////AAAB/uAAAAAAAAAAAAAAPY8AE//8AAAH/////+AAAAAAAAAAAAfAAAAP////AAAA4CAAAAAAAAAAAAAAf/A8e/f/gAAD/////8AAAAAAAAAAAB8ACAP/////+H4APAAAAAAAAAAAAAAA///5/4//4AAD/////wAAAAAAAAAAADwAHl////////8Af+AAAAAwAABAAAAAff/8O4///gAD/////wAAAAAAAAAAAHwAf/////////8///wAAABAAA//8gACAP//h8f//8AB/////4AAAAAAH/gAAA5Afv/////////////8AABAAD////P//3//n/D6/+AB/////gAAAAAB///AAwB/f//////////////////4AP/////////+Hfz4f/AAf///8AAAAAAP///4Mf/////////////////////+AH/////////////4f/4A///8AAAAAAAP///+M///////////////////////8P/////////////wD/+A///wAQYAAAAf////////////////////////////8//////////////g/+8Af//AA/+AAAA///+D///////////////////////BwP/////////////w//gAf/wAAf8AAAD/8//////////////////////////AGD////////////HYB/wAP/wAAHAAAAP///////////////////////////+AAP///////////+Aw2fAAH/AAAAAAAB//H//////////////////////////AAP///////////4AA/gAAD/AAAAAAAB//H//////////////////////3//AAAf///////////wAA/4QAAOAAAAAAAB//n//////////////////////D/8AAAB/7gD///////wAA/44AAAAAAAAAAB//h/////////////////////+DwAAAAAv8AA///////4AB//8AAAAAAAAA4A9/D///////////////////8AAPgAAAAAD8AAP///////AAf/+AAAAAAAAB8AG+n///////////////////wAAfgAAAAAeAAAH///////wAf/+AAAAAAAAA8AO+H///////////////////gAA/gAAAAB4AAAD////////g///gAAAAAAAB+APwH//////////////////+AAB/AAAAAGAAAABf///////z///4AAAAAAAP/APz////////////////////QAB/AAAAAQAAAABf///////x///8AAAAAAAPPA//////////////////////+AA8AAAAAAAAAAAn///////5///8AAAAAAAPfz///////////////////////AA4AAAAAAAAAAAD///////////8AAAAAAAMf3//////////////////////7AAwAAAAAAAAAAAD///////////sAAAAAAAAf///////////////////////7AAAAAAAAAAAAAAB//////////cfAAAAAAAAD///////////////////////7AAAAAAAAAAAAAAAf/////////wfgAAAAAAAf///////////////////////yAAAAAAAAAAAAAAAf/////B///gfgAAAAAAAP///////////////////////iAAAAAAAAAAAAAAAP//////////AgAAAAAAAD//////v/z//////////////iAAAAAAAAAAAAAAAP//////////AAAAAAAAAD/////H//n//////////////AAAAAAAAAAAAAAAAP//////v/+4AAAAAAAAAD//n/+Gf+P/////////////+HgAAAAAAAAAAAAAAf////////wgAAAAAAAAH//zz/+AH/H/////////////8HwAAAAAAAAAAAAAAf////////wAAAAAAAAAH/8N4/8AB/D/////////////QPAAAAAAAAAAAAAAAf////////wAAAAAAAAAH/4M8f/fh/i////////////8AIAAAAAAAAAAAAAAAf///////+AAAAAAAAAAH/gMPfP///x////////////8AMAAAAAAAAAAAAAAAP///////8AAAAAAAAAAP/AMGOP///x///////////fwAMAAAAAAAAAAAAAAAP///////4AAAAAAAAAAH/AAGHP///g//////////+B4AcAAAAAAAAAAAAAAAH///////wAAAAAAAAAAH+AEcHH///4///////////54B4AAAAAAAAAAAAAAAD///////wAAAAAAAAAAB8/+ACD///////////////w8D4AAAAAAAAAAAAAAAD///////wAAAAAAAAAAAz/+AAgM//////////////A8/4AAAAAAAAAAAAAAAB///////gAAAAAAAAAAB//+AAAI//////////////Ax/gAAAAAAAAAAAAAAAAf/////+AAAAAAAAAAAH///AAAB//////////////gH8AAAAAAAAAAAAAAAAAH/////8AAAAAAAAAAAP///4PAB//////////////wDAAAAAAAAAAAAAAAAAAH/////4AAAAAAAAAAAP///+P8///////////////wDAAAAAAAAAAAAAAAAAADf////4AAAAAAAAAAAP/////////////////////wAAAAAAAAAAAAAAAAAAAD///3g4AAAAAAAAAAAf/////////v///////////wAAAAAAAAAAAAAAAAAAAB///gAcAAAAAAAAAAA//////////n///////////wAAAAAAAAAAAAAAAAAAAB3/+AAcAAAAAAAAAAD///////9//j///////////gAAAAAAAAAAAAAAAAAAAA7/+AAMAAAAAAAAAAD///////8//w3//////////AAAAAAAAAAAAAAAAAAAAAZ/+AAMAAAAAAAAAAH///////+f/8b//////////AAAAAAAAAAAAAAAAAAAAAM/+AAAgAAAAAAAAAP////////f//4Af///////+wAAAAAAAAAAAAAAAAAAAAGf+AAAAAAAAAAAAAP////////P//+AP///////8wAAAAAAAAAAAAAAAAAAAAAP+AB/AAAAAAAAAAf////////n///AH///////ggAAAAAAAAAAAAAAAAAAAAAP+A4DwAAAAAAAAAf////////n///AH///P//+AAAAAAAAAAAAAAAAAAAAAAAP+B4A8AAAAAAAAAf////////3//+AAf/4P/+IAAAAAAAAAAAAAAAgAAAAAAAP/B4AB4AAAAAAAAf////////z//8AAf/wH/8YAAAAAAAAAAAAAAAAAAAAAAAD/3wAj9AAAAAAAAP////////x//4AAf/AD/8QAwAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAP////////4//wAAf+AD/+AA4AAAAAAAAAAAAAAAAAAAAAAH/wAAAAAAAAAAAf////////8//AAAf8AD//AA4AAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAAAAf////////8/8AAAP4AAf/gAwAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAf/////////fwAAAPwAAP/gA4AAAAAAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAf//////////AAAAP4AAP/wA8AAAAAAAAAAAAAAAAAAAAAAAAPgAgAAAAAAAAf/////////4AAAAH4AAN/wAXAAAAAAAAAAAAAAAAAAAAAAAAHgD4AAAAAAAAP/////////w4AAAHwAAMfwALAAAAAAAAAAAAAAAAAAAAAAAADgP/eAAAAAAAH//////////4AAADwAAMfAAOAAAAAAAAAAAAAAAAAAAAAAAABzP/+AAAAAAAD//////////4AAADoAAMGACPAAAAAAAAAAAAAAAAAAAAAAAAA////gAAAAAAD//////////4AAADIAAMAAAHgAAAAAAAAAAAAAAAAAAAAAAAAN///wAAAAAAB//////////wAAAAMAAGAAAPgAAAAAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAf/////////wAAAAMAADAAMDAAAAAAAAAAAAAAAAAAAAAAAAAA////wAAAAAAP/h///////gAAAAAABjgAeAAAAAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAHAB///////AAAAAAAB7wA+AAAAAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAAAAP//////AAAAAAAAdwB8AAAAAAAAAAAAAAAAAAAAAAAAAAB////8AAAAAAAAAD/////+AAAAAAAAPwH8AAAAAAAAAAAAAAAAAAAAAAAAAAB////8AAAAAAAAAH/////4AAAAAAAAHwf+CYAAAAAAAAAAAAAAAAAAAAAAAAD////8AAAAAAAAAH/////wAAAAAAAAHwf8+YAAAAAAAAAAAAAAAAAAAAAACAH/////gAAAAAAAAH///z/gAAAAAAAADwf9oDwAAAAAAAAAAAAAAAAAAAAAAAH/////8AAAAAAAAH///3/AAAAAAAAAD4P54B5gAAAAAAAAAAAAAAAAAAAAAAH//////AAAAAAAAH////+AAAAAAAAAB+P5wA78AAAAAAAAAAAAAAAAAAAAAAH//////4AAAAAAAD////8AAAAAAAAAA8D54O//gAAAAAAAAAAAAAAAAAAAAAH//////+AAAAAAAB////8AAAAAAAAAAcAB4AH/wYAAAAAAAAAAAAAAAAAAAAH///////gAAAAAAB////4AAAAAAAAAAMABIAB/5wAAAAAAAAAAAAAAAAAAAAH///////gAAAAAAA////8AAAAAAAAAAH8AAAI/9hAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAA////8AAAAAAAAAAB/AAAA/8AAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///8AAAAAAAAAAAPuxgA/OAAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///8AAAAAAAAAAAABDAAEHACAAAAAAAAAAAAAAAAAAAA///////AAAAAAAAf///+AAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAA//////+AAAAAAAAf///+AAAAAAAAAAAAAADwCAAAAAAAAAAAAAAAAAAAAAAAf/////8AAAAAAAAf///8AQAAAAAAAAAAAAD+DAAAAAAAAAAAAAAAAAAAAAAAf/////4AAAAAAAA////+AwAAAAAAAAAAAAD8HAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAA////+AwAAAAAAAAAAAB38DgAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAA////+H4AAAAAAAAAAAD/+DwAACAAAAAAAAAAAAAAAAAAAD/////4AAAAAAAB////8PwAAAAAAAAAAAH//nwAAAABAAAAAAAAAAAAAAAAAA/////4AAAAAAAB////wPwAAAAAAAAAAAP///wAAAACAAAAAAAAAAAAAAAAAAf////4AAAAAAAA////gPwAAAAAAAAAAAP///4AAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAA////APgAAAAAAAAAAA////8AAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAAf//+APgAAAAAAAAAAP////+AAAAAAAAAAAAAAAAAAAAAAAf////gAAAAAAAAf///APgAAAAAAAAAAf/////AAGAAAAAAAAAAAAAAAAAAAAf////gAAAAAAAAP///AfAAAAAAAAAAB//////gACAAAAAAAAAAAAAAAAAAAAf///8AAAAAAAAAP///AfAAAAAAAAAAB//////gAAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAAAAP//+AfAAAAAAAAAAB//////wAAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//8AMAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AAAAAAAAAAAAB//////4AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAA///+AAAAAAAAAAD//wAAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAA///+AAAAAAAAAAB//wAAAAAAAAAAAAAf/////8AAAAAAAAAAAAAAAAAAAAAA///8AAAAAAAAAAB//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAAAAA//AAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA/+AAAAAAAAAAAAAAf/wf//4AAAAAAAAAAAAAAAAAAAAAA///gAAAAAAAAAAA/8AAAAAAAAAAAAAAf8AP//wAAAAAAAAAAAAAAAAAAAAAA///AAAAAAAAAAAAcAAAAAAAAAAAAAAAfAAF//gAAAAAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//gAABgAAAAAAAAAAAAAAAAAB//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/AAAAgAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAA4AAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAA+AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAHwAAAAAAAAAAAAAAAAAD/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAHAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAeAAAAAAAAAAAAAAAAAAH/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8AAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAP+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+AAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgAAAAAAAAAAAAAAAAABgAAAAAB/4CAAAMAAAAAAAAAAAAAAAAAAAAAAAAAB/AAAAAAAAAAAAAAAAAAP4AAAD/////4/3/4AAAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAH///kAH//////////4AAAAAAAAAAAAAAAAAAAAAAAT/gAAAAAAAAAAAAAAGD/////A////////////+AAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAABgAfAD/////////////////////8AAAAAAAAAAAAAAAAAAAAH//AAAAAAAAP////////////////////////////+AAAAAAAAAAAAAAA+AAAP//AAAAAAAD//////////////////////////////4AAAAAAAAAAAAAB//4A1//AAAAAAB///////////////////////////////4AAAAAAAAAB+ADB///////AAAAAAH///////////////////////////////wAAAAAAABf////4//////+AAAAAA///////////////////////////////8AAAAAAAD//////////////wAAAAH///////////////////////////////wAAAAAAD////////////////gAAB////////////////////////////////gAAAAA///////////////////x+///////////////////////////////////8////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////';
  let landMask = null;
  function isLand(lon, lat) {
    if (!landMask) { const bin = atob(LAND_MASK_B64); landMask = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) landMask[i] = bin.charCodeAt(i); }
    const i = clamp(Math.floor(lon + 180), 0, 359), j = clamp(Math.floor(90 - lat), 0, 179);
    const k = j * 360 + i;
    return (landMask[k >> 3] >> (7 - (k & 7))) & 1;
  }

  // Longitude of the Americas that separates the Pacific (west) from the Atlantic (east), by latitude.
  function pacificBoundary(lat) {
    if (lat < -18) return -70;
    if (lat < 8) return -78;
    if (lat < 20) return -78 - (lat - 8) * 2.25;
    if (lat < 32) return -105 - (lat - 20) * 0.8;
    return -100;
  }

  function oceanName(lon, lat) {   // [en, es]
    if (lat < -60) return ['the Southern Ocean', 'el océano Austral'];
    if (lat > 66) return ['the Arctic Ocean', 'el océano Ártico'];
    if (lon >= -6 && lon <= 42 && lat >= 30 && lat <= 47) return ['the Mediterranean and Black Sea', 'el Mediterráneo y el mar Negro'];
    if (lon >= 45 && lon <= 56 && lat >= 36 && lat <= 48) return ['the Caspian Sea', 'el mar Caspio'];
    const pb = pacificBoundary(lat);
    if (lon > pb && lon < -60 && lat >= 9 && lat <= 31) return ['the Caribbean and Gulf of Mexico', 'el Caribe y el golfo de México'];
    if (lon > pb && lon < (lat >= 30 ? 45 : 20)) return lat >= 0 ? ['the North Atlantic', 'el Atlántico Norte'] : ['the South Atlantic', 'el Atlántico Sur'];
    if (lon >= 20 && lon < 100 && lat < 31) return ['the Indian Ocean', 'el océano Índico'];
    if (lon >= 100 && lon < 147 && lat < -10) return ['the Indian Ocean', 'el océano Índico'];
    if (lon >= 100 && lon < 130 && lat >= -10 && lat <= 25) return ['the seas of Southeast Asia', 'los mares del Sudeste Asiático'];
    if (Math.abs(lat) <= 6) return ['the equatorial Pacific', 'el Pacífico ecuatorial'];
    return lat >= 0 ? ['the North Pacific', 'el Pacífico Norte'] : ['the South Pacific', 'el Pacífico Sur'];
  }

  function coords(lon, lat) {
    const la = Math.abs(lat).toFixed(0) + '°' + (lat >= 0 ? 'N' : 'S');
    const lo = Math.abs(lon).toFixed(0) + '°' + (lon >= 0 ? 'E' : (EBE.i18n.getLang() === 'es' ? 'O' : 'W'));
    return la + ' ' + lo;
  }

  // "near the Amazon (5°S 60°W)" on land, "in the equatorial Pacific (2°S 100°W)" at sea.
  // forceLand: for fires, which are always on land even in coastal cells.
  function placeName(lon, lat, forceLand) {
    const es = EBE.i18n.getLang() === 'es';
    if (forceLand || isLand(lon, lat)) {
      if (lat < -60) return (es ? 'en la Antártida' : 'in Antarctica') + ' (' + coords(lon, lat) + ')';
      for (const r of LAND) {
        if (lon >= r[0] && lon <= r[1] && lat >= r[2] && lat <= r[3]) {
          return EBE.i18n.t('common.near', { place: es ? r[5] : r[4] }) + ' (' + coords(lon, lat) + ')';
        }
      }
      return coords(lon, lat);
    }
    const o = oceanName(lon, lat);
    return EBE.i18n.t('common.inSea', { place: es ? o[1] : o[0] }) + ' (' + coords(lon, lat) + ')';
  }


  // ---------- continents and oceans (spoken in blind mode) ----------
  // Coarse rules on top of the 1-degree land mask. The Americas are split in three:
  // North (with Mexico and Greenland), Central (Guatemala to Panama, plus the Caribbean islands) and South.
  function continentKey(lon, lat) {
    if (lat < -60) return 'antarctica';
    if ((lon < -125 && lat < 28) || (lon < -100 && lat < -10)) return 'oceania';      // Hawaii, Polynesia
    if (lon < -168.5 && lat > 64) return 'asia';                                       // Chukotka, across 180°
    if (lon > -32 && lon < -24 && lat > 36 && lat < 40.5) return 'europe';             // Azores
    if (lat > 59 && lon > -75 && lon < -10) return (lat < 67.5 && lon > -26) ? 'europe' : 'northAmerica';  // Iceland / Greenland
    if (lon < -30) {
      if (lat < 7) return 'southAmerica';
      if (lat < 12.6 && lon > -77.3) return (lon > -63 && lat >= 11.2) ? 'centralAmerica' : 'southAmerica';
      if ((lat < 16 && lon > -92.3) || (lat < 17.9 && lon > -90.5) || (lat < 18.6 && lon > -89.3 && lon < -87.4)) return 'centralAmerica';
      if (lat < 23.6 && lon > -85.2 && lon < -59) return 'centralAmerica';            // Caribbean islands
      return 'northAmerica';
    }
    if (lon > 172 && lat > 50) return 'northAmerica';                                  // western Aleutians
    // Africa: south of the Mediterranean, west of the Red Sea, Madagascar and nearby islands.
    if (lon < 60 && lat < 37.5 && lat > -40) {
      if (lat < 12) return 'africa';
      if (lat <= 29.9) { if (lon < 32.6 + (29.9 - lat) * 0.624) return 'africa'; }
      else if (lon < 34.2 && lat < (lon < -1 ? 36.0 : lon < 12 ? 37.4 : 34.5)) return 'africa';
    }
    // Europe / Asia: Ural mountains and river, Caspian, Caucasus, Black Sea and Bosporus.
    if (lat > 34 && lon < 70) {
      if (lon < 26) return 'europe';
      if (lon < 29.2) return lat > 40.4 ? 'europe' : 'asia';
      if (lat >= 52) return lon < (lat >= 67 ? 66 : 60) ? 'europe' : 'asia';
      if (lat >= 47) return lon < 51.5 + (lat - 47) * 1.4 ? 'europe' : 'asia';
      if (lon < 40) return lat > 42.3 ? 'europe' : 'asia';
      if (lon < 49.6) return lat > 43.4 - (lon - 40) * 0.25 ? 'europe' : 'asia';
      return 'asia';
    }
    if (lon >= 110 && lat < -10.5) return 'oceania';                                   // Australia, New Zealand
    if (lon > 130.8 && lat < 0) return 'oceania';                                      // New Guinea, Melanesia
    if (lon > 133 && lat < 23) return 'oceania';                                       // Micronesia
    return 'asia';
  }

  function seaKey(lon, lat) {
    if (lat < -60) return 'southern';
    if (lat > 66) return 'arctic';
    if (lon >= 27.5 && lon <= 42 && lat >= 40.9 && lat <= 47) return 'blackSea';
    if (lon >= -5.6 && lon <= 37 && lat >= 30 && lat <= 46 && !(lon < 0 && lat > 38)) return 'mediterranean';
    if (lon >= 45 && lon <= 56 && lat >= 36 && lat <= 48) return 'caspian';
    if (lat >= 53.5 && lon <= 30.5 && ((lat <= 60.5 && lon >= 10) || (lon >= 17 && lon <= 25.5))) return 'baltic';
    if (lon >= -96 && lon <= -76 && lat >= 51 && lat <= 66) return 'hudson';
    const pb = pacificBoundary(lat);
    if (lon > pb && lon < -60 && lat >= 9 && lat <= 31) return (lat > 21.5 && lon < -80.5) ? 'gulfMexico' : 'caribbean';
    if (lon > pb && lon < (lat >= 30 ? 45 : 20)) return 'atlantic';
    if (lon >= 20 && lon < 100 && lat < 31) return 'indian';
    if (lon >= 100 && lon < 147 && lat < -10) return 'indian';
    return 'pacific';
  }

  // Key of the continent or ocean under a point, for EBE.i18n 'region.<key>'.
  function regionKey(lon, lat) {
    return isLand(lon, lat) ? continentKey(lon, lat) : seaKey(lon, lat);
  }

  EBE.geo = { haversineKm, bearing, dir8, placeName, coords, isLand, regionKey, continentKey, seaKey };

  // ---------- map view ----------
  // Two ways to draw the same data: the flat map (the real EIC frame as an image) and a 3D globe
  // wrapped in that same frame. Both share the points, flashes and Explore cursor, and both turn a
  // touch into a longitude and latitude, so the rest of the app does not need to know which is shown.
  const DEG = 180 / Math.PI;
  const GLOBE_MAX_PX = 720;          // the frames are 1024 px wide: half a world fits in ~512 px
  const SPIN_DEG_S = 4;              // gentle turn while listening (one turn in 90 s)
  const TILT_MAX = 65;

  function glowSprite(bright) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, bright ? 'rgba(255,255,255,0.95)' : 'rgba(235,235,235,0.85)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return c;
  }

  function MapView(root, opts) {
    this.opts = opts || {};
    this.root = root;
    this.points = null;
    this.flashes = [];
    this.cursor = { lon: -63.5, lat: -27.8, show: false, radiusKm: 0 };
    this.interactive = false;
    this.view = 'flat';
    this.lon0 = -60; this.lat0 = -15;          // globe centre: the Americas and the Atlantic
    this.target = null;                         // where the globe is turning to (keyboard, buttons)
    this.autoSpin = false; this.lastTouch = 0;
    this.tex = null; this.texDirty = true; this.globeDirty = true; this.lastGlobe = 0;
    this.sprites = [glowSprite(false), glowSprite(true)];

    const frame = document.createElement('div');
    frame.className = 'map';
    this.img = document.createElement('img');
    this.img.className = 'map-img';
    this.img.alt = '';
    this.img.decoding = 'async';
    this.img.addEventListener('load', () => { this.texDirty = true; this.globeDirty = true; });
    this.base = document.createElement('canvas');
    this.base.className = 'map-globe';
    this.base.setAttribute('aria-hidden', 'true');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'map-overlay';
    this.canvas.setAttribute('aria-hidden', 'true');
    frame.appendChild(this.img); frame.appendChild(this.base); frame.appendChild(this.canvas);
    root.appendChild(frame);
    this.frame = frame;
    this.ctx = this.canvas.getContext('2d');
    this.bctx = this.base.getContext('2d');
    this.layer = document.createElement('canvas');
    this.bindPointers();

    if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(frame);
    window.addEventListener('resize', () => this.resize());
    this.resize();
    let prev = 0;
    const loop = t => {
      if (this.frame.offsetParent !== null) this.tick(t, prev ? Math.min(100, t - prev) : 0);
      prev = t;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ---------- pointers ----------
  // Flat map: one pointer explores. Globe: a mouse drag turns it and moving the mouse explores;
  // on a touch screen two fingers turn it (left hand) while one finger points (right hand).
  MapView.prototype.bindPointers = function () {
    const frame = this.frame;
    const local = e => { const r = frame.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const touches = new Map();        // pointerId -> { x, y, role: 'wait' | 'cursor' | 'turn' | 'spin', t }
    let mouse = null;                 // mouse or pen drag on the globe
    const send = (x, y, type) => {
      if (!this.interactive || !this.opts.onPointer) return;
      const ll = this.fromXY(x, y);
      if (ll) this.opts.onPointer(ll[0], ll[1], type);
    };
    const end = () => { if (this.interactive && this.opts.onPointerEnd) this.opts.onPointerEnd(); };
    const turnBy = (dx, dy) => {
      const k = DEG / Math.max(40, this.R);
      this.lon0 = wrap(this.lon0 - dx * k);
      this.lat0 = clamp(this.lat0 + dy * k, -TILT_MAX, TILT_MAX);
      this.target = null; this.lastTouch = performance.now(); this.globeDirty = true;
    };
    const decide = id => {          // a lone finger that was not joined by a second one
      const p = touches.get(id);
      if (!p || p.role !== 'wait') return;
      p.role = this.interactive ? 'cursor' : 'spin';
      if (p.role === 'cursor') send(p.x, p.y, 'pointerdown');
    };

    frame.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      const [x, y] = local(e);
      if (this.view !== 'globe') {
        if (this.interactive) { frame.setPointerCapture(e.pointerId); send(x, y, e.type); }
        return;
      }
      try { frame.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      this.lastTouch = performance.now();
      if (e.pointerType !== 'touch') {
        mouse = { id: e.pointerId, x, y, moved: false };
        send(x, y, e.type);
        return;
      }
      // Touch: a second finger arriving soon after, or close to, a waiting one makes a turning pair.
      const now = performance.now();
      const partner = [...touches.entries()].find(([, p]) => p.role === 'wait' || (p.role === 'spin' && now - p.t < 400) ||
        (p.role !== 'cursor' && p.role !== 'turn' && Math.hypot(p.x - x, p.y - y) < this.R * 0.6));
      if (partner) {
        partner[1].role = 'turn'; clearTimeout(partner[1].timer);
        touches.set(e.pointerId, { x, y, role: 'turn', t: now });
        return;
      }
      const p = { x, y, role: 'wait', t: now };
      p.timer = setTimeout(() => decide(e.pointerId), 140);
      touches.set(e.pointerId, p);
    });

    frame.addEventListener('pointermove', e => {
      const [x, y] = local(e);
      if (this.view !== 'globe') {
        if (this.interactive && (e.buttons || e.pointerType === 'mouse')) send(clamp(x, 0, this.w), clamp(y, 0, this.h), e.type);
        return;
      }
      if (e.pointerType !== 'touch') {
        if (mouse && mouse.id === e.pointerId && e.buttons) {
          const dx = x - mouse.x, dy = y - mouse.y;
          if (mouse.moved || Math.hypot(dx, dy) > 4) { mouse.moved = true; turnBy(dx, dy); mouse.x = x; mouse.y = y; }
        } else if (!e.buttons) send(x, y, e.type);
        return;
      }
      const p = touches.get(e.pointerId);
      if (!p) return;
      const dx = x - p.x, dy = y - p.y;
      if (p.role === 'wait' && Math.hypot(x - p.x, y - p.y) > 12) { clearTimeout(p.timer); decide(e.pointerId); }
      if (p.role === 'cursor') send(x, y, e.type);
      else if (p.role === 'spin') turnBy(dx, dy);
      else if (p.role === 'turn') {
        const n = [...touches.values()].filter(q => q.role === 'turn').length || 1;
        turnBy(dx / n, dy / n);       // the pair moves the globe by its average movement
      }
      if (p.role !== 'wait') { p.x = x; p.y = y; }
    });

    const up = e => {
      if (this.view !== 'globe') { if (e.type === 'pointerup' || e.type === 'pointercancel') end(); return; }
      if (e.pointerType !== 'touch') {
        if (mouse && mouse.id === e.pointerId) { if (!mouse.moved) end(); mouse = null; }
        return;
      }
      const p = touches.get(e.pointerId);
      if (!p) return;
      clearTimeout(p.timer);
      if (p.role === 'wait' && this.interactive) { send(p.x, p.y, 'pointerdown'); p.role = 'cursor'; }   // a quick tap
      touches.delete(e.pointerId);
      if (p.role === 'cursor') end();
      if (p.role === 'turn') touches.forEach(q => { if (q.role === 'turn') q.role = 'done'; });
    };
    frame.addEventListener('pointerup', up);
    frame.addEventListener('pointercancel', up);
  };

  function wrap(lon) { lon = ((lon + 180) % 360 + 360) % 360 - 180; return lon; }

  // ---------- size and projection ----------
  MapView.prototype.resize = function () {
    const r = this.frame.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height); this.dpr = dpr;
    [this.canvas, this.layer].forEach(c => { c.width = Math.round(this.w * dpr); c.height = Math.round(this.h * dpr); });
    this.cx = this.w / 2; this.cy = this.h / 2;
    this.R = Math.max(10, Math.min(this.w, this.h) / 2 * 0.9);
    const d = Math.round(this.R * 2);
    Object.assign(this.base.style, { width: d + 'px', height: d + 'px', left: Math.round(this.cx - d / 2) + 'px', top: Math.round(this.cy - d / 2) + 'px' });
    const n = Math.max(64, Math.min(GLOBE_MAX_PX, Math.round(d * dpr)));
    if (n !== this.base.width) { this.base.width = this.base.height = n; this.lut = null; this.out = null; }
    // Room left on each side of the globe: wide screens show the numbers there (see .hud).
    const side = (this.w - this.R * 2) / 2, fig = this.root.parentNode;
    this.frame.classList.toggle('wide', this.view === 'globe' && side >= 210);
    if (fig && fig.style) fig.style.setProperty('--hud-w', Math.max(0, Math.round(side - 36)) + 'px');
    this.globeDirty = true;
    this.renderLayer();
  };

  // Screen position of a place, and whether it is on the visible side (flat map: always).
  MapView.prototype.proj = function (lon, lat) {
    if (this.view !== 'globe') return [(lon + 180) / 360 * this.w, (90 - lat) / 180 * this.h, 1];
    const p = lat * RAD, p0 = this.lat0 * RAD, dl = (lon - this.lon0) * RAD;
    const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(dl);
    const x = Math.cos(p) * Math.sin(dl);
    const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dl);
    return [this.cx + x * this.R, this.cy - y * this.R, cosc];
  };
  MapView.prototype.toXY = function (lon, lat) { return this.proj(lon, lat); };

  // Place under a screen position, or null outside the globe.
  MapView.prototype.fromXY = function (x, y) {
    if (this.view !== 'globe') return [x / this.w * 360 - 180, 90 - y / this.h * 180];
    const nx = (x - this.cx) / this.R, ny = (this.cy - y) / this.R, r2 = nx * nx + ny * ny;
    if (r2 > 1) return null;
    const nz = Math.sqrt(1 - r2), p0 = this.lat0 * RAD;
    const lat = Math.asin(clamp(nz * Math.sin(p0) + ny * Math.cos(p0), -1, 1)) * DEG;
    const lon = wrap(this.lon0 + Math.atan2(nx, nz * Math.cos(p0) - ny * Math.sin(p0)) * DEG);
    return [lon, lat];
  };

  // ---------- public API ----------
  MapView.prototype.setView = function (view) {
    view = view === 'globe' ? 'globe' : 'flat';
    if (view === this.view) return;
    this.view = view;
    this.frame.classList.toggle('sphere', view === 'globe');
    this.resize();
  };

  // Turn the globe by some degrees of longitude (buttons), smoothly.
  MapView.prototype.turn = function (dLon) {
    const from = this.target ? this.target[0] : this.lon0;
    this.target = [wrap(from + dLon), this.lat0];
    this.lastTouch = performance.now();
  };

  MapView.prototype.setAutoSpin = function (on) { this.autoSpin = !!on; };

  MapView.prototype.setImage = function (src, alt) {
    if (src) { this.frame.classList.remove('no-image'); if (this.img.getAttribute('src') !== src) this.img.src = src; }
    else { this.frame.classList.add('no-image'); this.img.removeAttribute('src'); this.tex = null; this.globeDirty = true; }
    this.img.alt = alt || '';
  };

  MapView.prototype.setInteractive = function (on) {
    this.interactive = !!on;
    this.frame.classList.toggle('interactive', !!on);
  };

  MapView.prototype.setPoints = function (points) { this.points = points; this.renderLayer(); };

  MapView.prototype.flash = function (lon, lat, intensity) {
    if (EBE.a11y.reducedMotion()) return;
    this.flashes.push({ lon, lat, i: intensity, t: performance.now() });
    if (this.flashes.length > 120) this.flashes.shift();
  };

  // follow: when the cursor moves with the keyboard, the globe turns to keep it in front.
  MapView.prototype.setCursor = function (lon, lat, show, radiusKm, follow) {
    this.cursor = { lon, lat, show: !!show, radiusKm: radiusKm || 0 };
    if (show && follow && this.view === 'globe' && this.proj(lon, lat)[2] < 0.55) this.target = [lon, clamp(lat, -TILT_MAX, TILT_MAX)];
  };

  // ---------- drawing ----------
  MapView.prototype.loadTexture = function () {
    this.texDirty = false;
    if (!this.img.complete || !this.img.naturalWidth || this.frame.classList.contains('no-image')) return;
    const c = this.texCanvas || (this.texCanvas = document.createElement('canvas'));
    c.width = this.texW = this.img.naturalWidth; c.height = this.texH = this.img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(this.img, 0, 0);
    try { this.tex = g.getImageData(0, 0, this.texW, this.texH).data; } catch (e) { this.tex = null; }
    this.globeDirty = true;
  };

  // For every pixel of the disc: its longitude (relative to the centre), its row in the frame and how
  // much light it gets (darker at the edge and away from a light at the top left, like a real sphere).
  MapView.prototype.buildLut = function () {
    const n = this.base.width, p0 = this.lat0 * RAD, s0 = Math.sin(p0), c0 = Math.cos(p0);
    const lut = this.lut && this.lut.length === n * n * 3 ? this.lut : new Float32Array(n * n * 3);
    const L = [-0.45, 0.55, 0.7], ln = Math.hypot(L[0], L[1], L[2]);
    for (let y = 0; y < n; y++) {
      const ny = 1 - (y + 0.5) / n * 2;
      for (let x = 0; x < n; x++) {
        const k = (y * n + x) * 3, nx = (x + 0.5) / n * 2 - 1, r2 = nx * nx + ny * ny;
        if (r2 > 1) { lut[k] = -9; continue; }
        const nz = Math.sqrt(1 - r2);
        const lat = Math.asin(Math.max(-1, Math.min(1, nz * s0 + ny * c0)));
        const lon = Math.atan2(nx, nz * c0 - ny * s0);
        lut[k] = lon / (2 * Math.PI);
        lut[k + 1] = Math.min(0.9999, Math.max(0, 0.5 - lat / Math.PI));
        const lambert = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ln);
        lut[k + 2] = (0.42 + 0.58 * Math.pow(nz, 0.55)) * (0.78 + 0.32 * lambert);
      }
    }
    this.lut = lut; this.lutTilt = this.lat0;
  };

  MapView.prototype.renderGlobe = function () {
    this.globeDirty = false;
    const n = this.base.width;
    if (!this.lut || this.lutTilt !== this.lat0) this.buildLut();
    if (!this.out || this.out.width !== n) this.out = this.bctx.createImageData(n, n);
    const d = this.out.data, lut = this.lut, tex = this.tex, W = this.texW, H = this.texH;
    const off = this.lon0 / 360 + 0.5;
    for (let k = 0, p = 0, m = n * n; k < m; k++, p += 4) {
      const u = lut[k * 3];
      if (u < -1) { d[p + 3] = 0; continue; }
      const s = Math.min(1.15, lut[k * 3 + 2]);
      if (!tex) { d[p] = d[p + 1] = d[p + 2] = 40 * s; d[p + 3] = 255; continue; }
      let uu = u + off; uu -= Math.floor(uu);
      const q = (((lut[k * 3 + 1] * H) | 0) * W + ((uu * W) | 0)) * 4;
      d[p] = Math.min(255, tex[q] * s); d[p + 1] = Math.min(255, tex[q + 1] * s); d[p + 2] = Math.min(255, tex[q + 2] * s); d[p + 3] = 255;
    }
    this.bctx.putImageData(this.out, 0, 0);
  };

  // Static layer: halo and graticule (globe) or graticule without image (flat), then the point glows.
  MapView.prototype.renderLayer = function () {
    const c = this.layer.getContext('2d'), dpr = this.dpr || 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    const globe = this.view === 'globe';
    if (globe) {
      // A few faint stars (always in the same places) and a soft atmosphere around the planet.
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 160; i++) {
        const x = rnd() * this.w, y = rnd() * this.h, a = 0.12 + rnd() * 0.4, r = 0.5 + rnd() * 0.9;
        if (Math.hypot(x - this.cx, y - this.cy) < this.R * 1.1) continue;
        c.globalAlpha = a; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
      const halo = c.createRadialGradient(this.cx, this.cy, this.R * 0.98, this.cx, this.cy, this.R * 1.12);
      halo.addColorStop(0, 'rgba(255,255,255,0.22)'); halo.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = halo; c.beginPath(); c.arc(this.cx, this.cy, this.R * 1.12, 0, Math.PI * 2); c.arc(this.cx, this.cy, this.R, 0, Math.PI * 2, true); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 1;
      const line = pts => { c.beginPath(); let on = false; for (const [lo, la] of pts) { const [x, y, v] = this.proj(lo, la); if (v > 0) { if (on) c.lineTo(x, y); else c.moveTo(x, y); on = true; } else on = false; } c.stroke(); };
      for (let lon = -180; lon < 180; lon += 30) { const pts = []; for (let la = -90; la <= 90; la += 3) pts.push([lon, la]); line(pts); }
      for (let lat = -60; lat <= 60; lat += 30) { const pts = []; for (let lo = -180; lo <= 180; lo += 3) pts.push([lo, lat]); line(pts); }
    } else if (this.frame.classList.contains('no-image')) {
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) { const [x] = this.proj(lon, 0); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, this.h); c.stroke(); }
      for (let lat = -90; lat <= 90; lat += 30) { const [, y] = this.proj(0, lat); c.beginPath(); c.moveTo(0, y); c.lineTo(this.w, y); c.stroke(); }
    }
    if (!this.points) return;
    // Glow size follows the map size, so small phone screens do not turn fires into one blob.
    const scale = Math.max(0.4, Math.min(1.2, (globe ? this.R * 2.4 : this.w) / 1024));
    c.globalCompositeOperation = 'lighter';
    for (const p of this.points) {
      const [x, y, v] = this.proj(p[0], p[1]);
      if (v <= 0.02) continue;
      const r = (1.1 + 2.8 * p[2]) * scale * 2.2 * (globe ? 0.55 + 0.45 * v : 1);
      c.globalAlpha = globe ? Math.min(1, 0.35 + v) : 1;
      c.drawImage(this.sprites[p[2] > 0.66 ? 1 : 0], x - r, y - r, r * 2, r * 2);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  };

  MapView.prototype.tick = function (t, dt) {
    if (this.view === 'globe') {
      let moved = false;
      if (this.target) {
        const dl = wrap(this.target[0] - this.lon0), dp = this.target[1] - this.lat0;
        if (Math.abs(dl) < 0.3 && Math.abs(dp) < 0.3) { this.lon0 = this.target[0]; this.lat0 = this.target[1]; this.target = null; }
        else { const f = Math.min(1, dt / 160); this.lon0 = wrap(this.lon0 + dl * f); this.lat0 += dp * f; }
        moved = true;
      } else if (this.autoSpin && !EBE.a11y.reducedMotion() && t - this.lastTouch > 4000) {
        this.lon0 = wrap(this.lon0 - SPIN_DEG_S * dt / 1000); moved = true;   // the Earth turns west to east
      }
      if (moved) { this.globeDirty = true; }
      if (this.texDirty) this.loadTexture();
      if (this.globeDirty && t - this.lastGlobe > 30) { this.lastGlobe = t; this.renderGlobe(); this.renderLayer(); }
    }
    this.draw();
  };

  MapView.prototype.draw = function () {
    const c = this.ctx, dpr = this.dpr || 1;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.drawImage(this.layer, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const now = performance.now();
    this.flashes = this.flashes.filter(f => now - f.t < 700);
    for (const f of this.flashes) {
      const [x, y, v] = this.proj(f.lon, f.lat);
      if (v <= 0.02) continue;
      const age = (now - f.t) / 700;
      c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - age)).toFixed(3) + ')';
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(x, y, 3 + 14 * age * (0.5 + f.i), 0, Math.PI * 2); c.stroke();
    }
    if (this.cursor.show) {
      const cu = this.cursor, [x, y, v] = this.proj(cu.lon, cu.lat);
      if (v > 0) {
        if (cu.radiusKm) {
          c.strokeStyle = 'rgba(255,255,255,0.55)'; c.setLineDash([4, 4]); c.lineWidth = 1;
          if (this.view === 'globe') {
            // A circle on the ground, drawn point by point so it bends with the sphere.
            const d = cu.radiusKm / 6371, p1 = cu.lat * RAD, l1 = cu.lon * RAD;
            c.beginPath(); let on = false;
            for (let a = 0; a <= 360; a += 10) {
              const th = a * RAD, p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(th));
              const l2 = l1 + Math.atan2(Math.sin(th) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
              const [px, py, pv] = this.proj(l2 * DEG, p2 * DEG);
              if (pv > 0) { if (on) c.lineTo(px, py); else c.moveTo(px, py); on = true; } else on = false;
            }
            c.stroke();
          } else {
            const ry = cu.radiusKm / 111 / 180 * this.h;
            const rx = ry / Math.max(0.2, Math.cos(cu.lat * RAD));
            c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.stroke();
          }
          c.setLineDash([]);
        }
        c.strokeStyle = '#ffffff'; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.moveTo(x - 15, y); c.lineTo(x - 5, y); c.moveTo(x + 5, y); c.lineTo(x + 15, y);
        c.moveTo(x, y - 15); c.lineTo(x, y - 5); c.moveTo(x, y + 5); c.lineTo(x, y + 15); c.stroke();
      }
    }
  };

  EBE.MapView = MapView;
})();
