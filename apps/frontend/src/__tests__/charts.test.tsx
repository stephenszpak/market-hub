import { render, screen } from '@testing-library/react'
import Charts from '../pages/Charts'

test('renders demo chart heading', () => {
  render(<Charts />)
  expect(screen.getByText(/Demo Chart/i)).toBeInTheDocument()
})

