import { test, expect, type Page } from '@playwright/test';
async function tab(page: Page, name: string) {
  const desktop = page.getByRole('navigation', { name: 'Navegación principal' });
  const nav = (await desktop.isVisible())
    ? desktop
    : page.getByRole('navigation', { name: 'Navegación móvil' });
  await nav.getByRole('button', { name, exact: true }).click();
}
test('explorar, filtrar, guardar favorito y abrir mapa sin desbordamiento', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'El talento que necesitas, está en tu barrio.' }),
  ).toBeVisible();
  await expect(page.locator('.tech-card')).toHaveCount(6);
  await page.screenshot({ path: `test-results/inicio-${info.project.name}.png`, fullPage: true });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: 'Electricidad', exact: true }).click();
  await expect(page.locator('.tech-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Añadir a favoritos a Carlos Restrepo' }).click();
  await tab(page, 'Favoritos');
  await expect(page.getByRole('heading', { name: 'Carlos Restrepo' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Carlos Restrepo' })).toBeVisible();
  await tab(page, 'Explorar');
  await page.getByRole('textbox', { name: 'Buscar técnico, oficio o barrio' }).fill('ninguno');
  await expect(
    page.getByRole('heading', { name: 'No encontramos técnicos con estos filtros' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restablecer filtros', exact: true }).click();
  await page.getByRole('button', { name: 'Mapa', exact: true }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.locator('.map-pin')).toHaveCount(6);
  await page.locator('.map-pin').first().click();
  await expect(page.getByRole('heading', { name: 'Tu experto del barrio' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('publicar, recibir cotización, finalizar, reseñar y persistir', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Pedir una mano' }).click();
  await page.getByLabel('Título de la solicitud').fill('Reparar tomacorriente de la cocina');
  await page
    .getByLabel('Descripción', { exact: false })
    .fill('El tomacorriente de la cocina dejó de funcionar y necesitamos revisarlo.');
  await page.getByRole('button', { name: 'Publicar solicitud exprés', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mis solicitudes', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Reparar tomacorriente de la cocina/ }).click();
  await page.getByRole('button', { name: 'Añadir cotización de ejemplo' }).click();
  await expect(page.locator('.quote-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Elegir esta cotización' }).click();
  await page.getByRole('button', { name: 'Marcar servicio como finalizado' }).click();
  await page.getByRole('button', { name: 'Calificar el servicio' }).click();
  await page.getByRole('button', { name: '5 estrellas', exact: true }).click();
  await page
    .getByLabel('Tu experiencia', { exact: true })
    .fill('Excelente atención y un trabajo muy cuidadoso.');
  await page.getByRole('button', { name: 'Publicar reseña', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Tu opinión cuenta' })).toHaveCount(0);
  await expect(page.getByText('Ya compartiste tu experiencia. ¡Gracias!')).toBeVisible();
  await page.locator('ion-toast').getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.locator('ion-toast')).toBeHidden();
  await page.screenshot({ path: `test-results/servicio-${info.project.name}.png`, fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Historial', exact: true }).click();
  await page.getByRole('button', { name: /Reparar tomacorriente de la cocina/ }).click();
  await expect(page.getByText('Ya compartiste tu experiencia. ¡Gracias!')).toBeVisible();
  const database = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('CapacitorStorage.barriored.database.v1')!),
  );
  expect(database.requests[0].status).toBe('completed');
  expect(database.reviews).toHaveLength(1);
  expect(database.requests[0].approximateLocation).toEqual({ lat: 6.24, lng: -75.58 });
  expect(errors).toEqual([]);
});
test('editar perfil técnico y recibir solicitudes por oficio', async ({ page }) => {
  await page.goto('/');
  await tab(page, 'Mi perfil');
  await page.getByRole('button', { name: /Soy técnico/ }).click();
  await page.getByLabel('Nombre completo').fill('Daniel Medina');
  await page
    .getByLabel('Sobre tu trabajo')
    .fill('Instalaciones y mantenimiento eléctrico en el barrio.');
  await page.getByLabel('Celular de contacto').fill('3001234567');
  await page.getByRole('button', { name: 'Guardar mi perfil' }).click();
  await tab(page, 'Solicitudes');
  await expect(page.getByRole('heading', { name: 'Oportunidades del barrio' })).toBeVisible();
  await page.reload();
  await tab(page, 'Mi perfil');
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Daniel Medina');
  await expect(page.getByRole('button', { name: /Soy técnico/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('cotizar con perfil técnico, adjuntar foto y conservar datos sin red', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pedir una mano' }).click();
  await page.getByLabel('Título de la solicitud').fill('Instalar una lámpara en la sala');
  await page
    .getByLabel('Descripción', { exact: false })
    .fill('Tenemos una lámpara nueva y necesitamos ayuda con la instalación.');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#d9f28c';
    context.fillRect(0, 0, 160, 120);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Adjuntar fotografía').setInputFiles({
    name: 'lampara.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await expect(page.getByAltText('Fotografía adjunta')).toBeVisible();
  await page.getByRole('button', { name: 'Publicar solicitud exprés', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mis solicitudes', exact: true })).toBeVisible();
  await tab(page, 'Mi perfil');
  await page.getByRole('button', { name: /Soy técnico/ }).click();
  await page.getByLabel('Nombre completo').fill('Técnico de prueba');
  await page
    .getByLabel('Sobre tu trabajo')
    .fill('Instalo lámparas y reviso instalaciones eléctricas en el barrio.');
  await page.getByRole('button', { name: 'Guardar mi perfil' }).click();
  await tab(page, 'Solicitudes');
  await page.getByRole('button', { name: /Instalar una lámpara en la sala/ }).click();
  await page.getByLabel('Valor de tu cotización (COP)').fill('60000');
  await page
    .getByLabel('Mensaje para el vecino')
    .fill('Puedo realizar la instalación esta tarde. Incluye la mano de obra.');
  await page.getByRole('button', { name: 'Enviar cotización local' }).click();
  await expect(page.locator('.quote-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Enviar cotización local' })).toHaveCount(0);
  await context.setOffline(true);
  await expect(
    page.getByText('Sin conexión. Puedes consultar y guardar datos en este dispositivo.'),
  ).toBeAttached();
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('CapacitorStorage.barriored.database.v1')!),
  );
  expect(data.requests[0].quotes[0].amount).toBe(60000);
  expect(data.requests[0].photo).toMatch(/^data:image\/jpeg/);
  await context.setOffline(false);
});

test('GPS denegado mantiene una zona de referencia y no bloquea la app', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (_success: unknown, failure: (error: unknown) => void) =>
          failure({ code: 1, message: 'Permission denied' }),
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Usar mi ubicación', exact: true }).click();
  await expect(page.locator('ion-toast')).toContainText('No pudimos obtener tu ubicación');
  await expect(page.locator('.tech-card')).toHaveCount(6);
});
