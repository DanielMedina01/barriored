import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import type { Point } from '../domain/models';
export async function locate(): Promise<Point> {
  if (Capacitor.isNativePlatform()) {
    const permission = await Geolocation.requestPermissions();
    if (permission.location === 'denied' && permission.coarseLocation === 'denied')
      throw new Error('Activa el permiso de ubicación en los ajustes del dispositivo.');
  }
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 60000,
  });
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}
export async function takePhoto(): Promise<string | undefined> {
  const photo = await Camera.getPhoto({
    quality: 65,
    width: 1000,
    height: 1000,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    correctOrientation: true,
  });
  return photo.dataUrl;
}
export async function readPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Elige una imagen JPG, PNG o WebP.');
  if (file.size > 6 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 6 MB.');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('No pudimos leer esta imagen. Prueba otra fotografía JPG, PNG o WebP.');
  });
  const ratio = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo procesar la imagen.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.65);
}
