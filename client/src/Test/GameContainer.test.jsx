import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Component chứa lệnh của bạn
const GameContainer = ({ games }) => {
  return <div data-testid="container">{games.length && <GameList games={games} />}</div>;
};

const GameList = () => <div data-testid="game-list">Danh sách Game</div>;

describe('Kiểm tra lỗi render số 0 của games.length', () => {
  test('không được in ra số 0 khi mảng games rỗng', () => {
    render(<GameContainer games={[]} />);

    const containerElement = screen.getByTestId('container');
    // Kỳ vọng container phải rỗng hoàn toàn, không chứa chữ hay số nào
    expect(containerElement).toBeEmptyDOMElement();
  });
});
