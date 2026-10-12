# Spanish UI review (A3 assets)

All `es` entries in `js/i18n.js`, including the 36 exact closing steps and closing proof-photo/callback labels, are machine-drafted and need native-speaker review before release. A3 wires the first-open picker and Counter toggle into the app; code-library data remains English. Production behavior still needs native-speaker review.

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
| Closing photo references | Referencias de fotos del cierre | Explain clearly that only a local filename/reference is saved, not the image. |
| Text closing proof packet | Enviar paquete de cierre por mensaje | Check whether this suggests a server send; the tech opens their SMS composer. |
| 3 of 3 free AI scans | Usaste las 3 de 3 lecturas de IA gratis | Confirm readable short copy and that an unsuccessful scan never triggers this offer. |

Seasonal checklist strings (`seasonal.*`) are machine-drafted. "Las notificaciones siguen apagadas" means the app does not request notification permission. "Sun Belt" is left in English as the region name. "Ocultar" only hides this year's in-app card.

Morning-route strings (`morning.*`) are machine-drafted. "Marcar listo" only closes a follow-up the tech typed.

Day-recap strings (`recap.*`) are machine-drafted. "Paquetes enviados" means the tech opened a text or share handoff, not that SplashLens delivered a message.

Stop-flow strings (`stop.*`) are machine-drafted. Review "Nueva visita", "Enviar resumen al cliente", and the line that says the text app opened but the tech still sends the message.

The code-answer causes, fixes, and manufacturer data can remain English under A3. A reviewer should also inspect mixed-language packets containing that data. Upgrade strings deliberately omit prices; the integrated UI must obtain current prices from server configuration and suppress offers in store shells.
