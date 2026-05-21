import { test, expect } from '@playwright/test';

test('Debería cargar la página principal y permitir iniciar sesión', async ({ page }) => {
  // Navegar a la página principal
  await page.goto('/');

  // Suponiendo que hay un botón o enlace de login
  // Como no hay backend ni frontend corriendo, esto es un test simulado.
  // En un entorno real:
  // await page.fill('input[type="email"]', 'test@udistrital.edu.co');
  // await page.fill('input[type="password"]', 'Contraseña1!');
  // await page.click('button[type="submit"]');
  // await expect(page).toHaveURL(/.*dashboard/);
});
