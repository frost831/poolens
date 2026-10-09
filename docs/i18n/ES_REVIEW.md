# Spanish UI review (A3 assets)

All `es` entries in `js/i18n.js` are machine-drafted and need native-speaker review before release. This sidecar does not wire the picker or toggle into the app, translate code-library data, or establish that the Spanish UI works in production.

Review against a pool-service technician's usage, including US Spanish and regional differences. Check the short labels on a phone in bright light and read the cautionary copy aloud. Keep manufacturer names, PartSnap, Pro, and code values unchanged unless product naming is deliberately changed.

| English term | Draft Spanish | Review point |
| --- | --- | --- |
| Counter | Mostrador | Could imply a retail counter rather than quick field mode. |
| Part | Pieza | Confirm trade preference versus `refacción` or `repuesto`. |
| Chem | Química | Check whether `químicos` better signals dosing. |
| Pool | Piscina | Check regional preference for `alberca` or `pileta`. |
| Proof / proof packet | Comprobantes / paquete de comprobantes | Distinguish evidence photos from receipt or payment proof. |
| Code answer | Respuesta | Check natural phrasing for an equipment error-code result. |
| Closing | Cierre de temporada | Avoid implying permanent closure or an unsupported winterization method. |
| Drain plugs | Tapones de drenaje | Verify field term for pump/filter/heater plugs. |
| Equipment drained | Equipo drenado | Confirm this does not imply a safety or completion guarantee. |
| Possible match / fit | Posible coincidencia / compatibilidad | Preserve uncertainty before parts ordering. |
| Qualified technician | Técnico calificado | Check appropriate trade/safety meaning. |
| Closing Pro pass | Pase Closing Pro | Confirm offer name only after the offer exists and is approved. |

The code-answer causes, fixes, and manufacturer data can remain English under A3. A reviewer should also inspect mixed-language packets containing that data. Upgrade strings deliberately omit prices; the integrated UI must obtain current prices from server configuration and suppress offers in store shells.
