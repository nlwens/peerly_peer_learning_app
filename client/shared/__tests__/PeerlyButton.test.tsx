import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PeerlyButton from '@/shared/components/ui/PeerlyButton';

describe('PeerlyButton', () => {
  it('should render with title', () => {
    render(
      <PeerlyButton
        title="Test Button"
        onPress={jest.fn()}
        backgroundColor="#000"
        textColor="#fff"
        accessibilityLabel="Test Button"
      />,
    );

    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();

    render(
      <PeerlyButton
        title="Click Me"
        onPress={onPress}
        backgroundColor="#000"
        textColor="#fff"
        accessibilityLabel="Click Me"
      />,
    );

    const button = screen.getByText('Click Me');
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalled();
  });

  it('should have accessibilityLabel', () => {
    render(
      <PeerlyButton
        title="Accessible"
        onPress={jest.fn()}
        backgroundColor="#000"
        textColor="#fff"
        accessibilityLabel="Accessible Button"
      />,
    );

    expect(screen.getByText('Accessible')).toBeTruthy();
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();

    render(
      <PeerlyButton
        title="Disabled"
        onPress={onPress}
        backgroundColor="#000"
        textColor="#fff"
        disabled={true}
        accessibilityLabel="Disabled Button"
      />,
    );

    const button = screen.getByText('Disabled');
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render with custom textStyle when provided', () => {
    render(
      <PeerlyButton
        title="Styled"
        onPress={jest.fn()}
        backgroundColor="#000"
        textColor="#fff"
        textStyle={{ fontSize: 20 }}
        accessibilityLabel="Styled Button"
      />,
    );

    expect(screen.getByText('Styled')).toBeTruthy();
  });

  it('should have accessibilityRole as button by default', () => {
    render(
      <PeerlyButton
        title="Button Role"
        onPress={jest.fn()}
        backgroundColor="#000"
        textColor="#fff"
        accessibilityLabel="Button Role"
      />,
    );

    expect(screen.getByText('Button Role')).toBeTruthy();
  });

  it('should render icon when provided', () => {
    const Icon = () => <></>;

    render(
      <PeerlyButton
        title="With Icon"
        onPress={jest.fn()}
        backgroundColor="#000"
        textColor="#fff"
        icon={<Icon />}
        accessibilityLabel="With Icon"
      />,
    );

    expect(screen.getByText('With Icon')).toBeTruthy();
  });
});

