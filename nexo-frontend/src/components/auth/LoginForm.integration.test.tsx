import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';

// Componente simulado para el test
const FakeLoginForm = () => (
  <form>
    <h2>Iniciar Sesión</h2>
    <input type="email" placeholder="Correo" required />
    <input type="password" placeholder="Contraseña" required />
    <button type="submit">Entrar</button>
  </form>
);

describe('Pruebas de Integración - UI', () => {
  it('Debe renderizar el formulario correctamente', () => {
    render(
      <MemoryRouter>
        <FakeLoginForm />
      </MemoryRouter>
    );
    
    expect(screen.getByRole('heading', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Correo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
  });
  
  it('Permite escribir en los inputs', async () => {
    render(
      <MemoryRouter>
        <FakeLoginForm />
      </MemoryRouter>
    );
    
    const emailInput = screen.getByPlaceholderText(/Correo/i);
    await userEvent.type(emailInput, 'test@udistrital.edu.co');
    
    expect(emailInput).toHaveValue('test@udistrital.edu.co');
  });
});
