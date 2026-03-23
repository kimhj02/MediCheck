/**
 * 카카오맵 JavaScript API v2 (WebView용 HTML)
 * 앱 키: 카카오 디벨로퍼스 → 내 애플리케이션 → JavaScript 키
 * 플랫폼: 반드시 「Web」 추가 후, 아래 webBaseUrl과 동일한 사이트 도메인 등록
 *   예: WebView source baseUrl이 https://localhost 이면 콘솔에 https://localhost 등록
 */

export type KakaoMapHospitalPin = {
  id: number
  lat: number
  lng: number
  name: string
}

export function buildKakaoMapHtml(
  appKey: string,
  centerLat: number,
  centerLng: number,
  zoomLevel: number,
  hospitals: KakaoMapHospitalPin[],
  /** WebView `source.baseUrl`과 동일해야 카카오 도메인 검증 통과 */
  webBaseUrlHint: string = 'https://localhost'
): string {
  const dataJson = JSON.stringify(hospitals)
  const originHintJs = JSON.stringify(webBaseUrlHint)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body, #map { margin:0; padding:0; width:100%; height:100%; overflow:hidden; }
    body { background:#E8EEF4; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function send(msg) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      } catch (e) {}
    }
  </script>
  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer"
    onerror='send({type:"kakaoError",code:"SCRIPT_LOAD",message:"카카오 지도 SDK 로드 실패. JavaScript 키·네트워크·카카오 콘솔 Web 사이트 도메인 등록을 확인하세요."})'
  ></script>
  <script>
    (function () {
      var WEB_ORIGIN_HINT = ${originHintJs};
      var HOSPITALS = ${dataJson};
      var CENTER_LAT = ${centerLat};
      var CENTER_LNG = ${centerLng};
      var ZOOM = ${zoomLevel};

      try {
        if (typeof kakao === 'undefined' || !kakao || !kakao.maps) {
          send({
            type: 'kakaoError',
            code: 'NO_KAKAO',
            message: 'Kakao SDK가 로드되지 않았습니다. 카카오 디벨로퍼스 → 내 애플리케이션 → 플랫폼 → Web → 사이트 도메인에 아래 주소를 추가하세요: ' + WEB_ORIGIN_HINT + ' (WebView baseUrl과 동일해야 합니다.) JavaScript 키를 사용 중인지도 확인하세요.'
          });
          return;
        }

        kakao.maps.load(function () {
          try {
            var container = document.getElementById('map');
            if (!container) {
              send({ type: 'kakaoError', code: 'NO_CONTAINER', message: '#map 요소 없음' });
              return;
            }
            var options = {
              center: new kakao.maps.LatLng(CENTER_LAT, CENTER_LNG),
              level: ZOOM
            };
            var map = new kakao.maps.Map(container, options);
            window.kakaoMap = map;

            var dotSvg =
              '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">' +
              '<circle cx="6" cy="6" r="4.5" fill="#0EA5E9" stroke="#ffffff" stroke-width="1.5"/></svg>';
            var dotSrc =
              'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(dotSvg);
            var dotSize = new kakao.maps.Size(12, 12);
            var dotOpt = { offset: new kakao.maps.Point(6, 6) };
            var dotImg = new kakao.maps.MarkerImage(dotSrc, dotSize, dotOpt);

            var markers = [];
            HOSPITALS.forEach(function (h) {
              if (h.lat == null || h.lng == null || isNaN(h.lat) || isNaN(h.lng)) return;
              var m = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(h.lat, h.lng),
                title: h.name || '',
                image: dotImg
              });
              kakao.maps.event.addListener(m, 'click', function () {
                send({ type: 'marker', id: h.id });
              });
              markers.push(m);
            });

            try {
              if (markers.length > 0 && typeof kakao.maps.MarkerClusterer === 'function') {
                new kakao.maps.MarkerClusterer({
                  map: map,
                  averageCenter: true,
                  minLevel: 7,
                  minClusterSize: 2,
                  gridSize: 50,
                  styles: [
                    {
                      width: '38px',
                      height: '38px',
                      background: 'rgba(14,165,233,0.92)',
                      borderRadius: '19px',
                      color: '#fff',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '12px',
                      lineHeight: '38px',
                      boxSizing: 'border-box',
                      border: '2px solid #fff'
                    }
                  ],
                  markers: markers
                });
              } else {
                markers.forEach(function (m) { m.setMap(map); });
              }
            } catch (cl) {
              markers.forEach(function (m) { m.setMap(map); });
            }

            send({ type: 'ready' });
          } catch (e) {
            send({
              type: 'kakaoError',
              code: 'MAP_INIT',
              message: (e && e.message) ? String(e.message) : String(e)
            });
          }
        });
      } catch (e) {
        send({
          type: 'kakaoError',
          code: 'OUTER',
          message: (e && e.message) ? String(e.message) : String(e)
        });
      }
    })();
  </script>
</body>
</html>`
}
