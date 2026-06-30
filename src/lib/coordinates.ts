export function toOpenLayersCoordinate(
  coordinate: [number, number],
  imageHeight: number
): [number, number] {
  return [coordinate[0], imageHeight - coordinate[1]];
}

export function toTopLeftImageCoordinate(
  coordinate: [number, number],
  imageHeight: number
): [number, number] {
  return [coordinate[0], imageHeight - coordinate[1]];
}
