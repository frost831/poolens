export const FIELD_CONFIG = Object.freeze({
  freeSuccessfulIdSoftGate: 5,
});

export function freeIdSoftGateCount(override = FIELD_CONFIG.freeSuccessfulIdSoftGate) {
  return typeof override === 'number' && Number.isInteger(override) && override > 0 ? override : 5;
}
