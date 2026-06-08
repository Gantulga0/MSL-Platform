import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Field } from '../Field';
import { Input } from '../Input';
import { StatusBadge } from '../Badge';
import { Pagination } from '../Pagination';
import { Check } from 'lucide-react';

describe('Button', () => {
  it('renders as a button and fires onClick via keyboard', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Хадгалах</Button>);
    const btn = screen.getByRole('button', { name: 'Хадгалах' });
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });

  it('sets aria-busy and disables when loading', () => {
    render(<Button loading>Илгээх</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });
});

describe('IconButton', () => {
  it('requires and exposes an accessible label', () => {
    render(<IconButton label="Хаах" icon={<Check />} />);
    expect(screen.getByRole('button', { name: 'Хаах' })).toBeInTheDocument();
  });
});

describe('Field + Input', () => {
  it('associates label, description and error with the control', () => {
    render(
      <Field label="И-мэйл" description="Танай и-мэйл хаяг" error="Шаардлагатай талбар" required>
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('И-мэйл', { exact: false });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ').length).toBe(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Шаардлагатай талбар');
  });
});

describe('StatusBadge', () => {
  it('renders the provided label text (not color-only)', () => {
    render(<StatusBadge status="approved" label="Зөвшөөрсөн" />);
    expect(screen.getByText('Зөвшөөрсөн')).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  const labels = {
    nav: 'Хуудаслалт',
    previous: 'Өмнөх',
    next: 'Дараах',
    page: (p: number, t: number) => `${p} / ${t}`,
  };

  it('disables previous on the first page', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={() => {}} labels={labels} />);
    expect(screen.getByRole('button', { name: 'Өмнөх' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Дараах' })).toBeEnabled();
  });

  it('advances the page on next', async () => {
    const onPageChange = jest.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} labels={labels} />);
    await userEvent.click(screen.getByRole('button', { name: 'Дараах' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
