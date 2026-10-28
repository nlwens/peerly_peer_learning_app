import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ChatInputBar } from '@/features/messages/components/ChatInputBar';

describe('ChatInputBar', () => {
  it('should render message input and send button', () => {
    render(<ChatInputBar value="" onChangeText={jest.fn()} onSend={jest.fn()} />);

    expect(screen.getByPlaceholderText('Type a message...')).toBeTruthy();
    expect(screen.getByText('Send')).toBeTruthy();
  });

  it('should call onChangeText when typing', () => {
    const onChangeText = jest.fn();

    render(<ChatInputBar value="" onChangeText={onChangeText} onSend={jest.fn()} />);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Hello World');

    expect(onChangeText).toHaveBeenCalledWith('Hello World');
  });

  it('should call onSend when send button pressed', () => {
    const onSend = jest.fn();

    render(<ChatInputBar value="Test message" onChangeText={jest.fn()} onSend={onSend} />);

    fireEvent.press(screen.getByText('Send'));

    expect(onSend).toHaveBeenCalled();
  });

  it('should display current value in input', () => {
    const { rerender } = render(<ChatInputBar value="Initial message" onChangeText={jest.fn()} onSend={jest.fn()} />);

    let input = screen.getByPlaceholderText('Type a message...');
    expect(input.props.value).toBe('Initial message');

    rerender(<ChatInputBar value="Updated message" onChangeText={jest.fn()} onSend={jest.fn()} />);

    input = screen.getByPlaceholderText('Type a message...');
    expect(input.props.value).toBe('Updated message');
  });

  it('should have correct accessibility labels', () => {
    render(<ChatInputBar value="" onChangeText={jest.fn()} onSend={jest.fn()} />);

    expect(screen.getByLabelText('Type a message')).toBeTruthy();
    expect(screen.getByLabelText('Send message')).toBeTruthy();
  });

  it('should render with empty value initially', () => {
    render(<ChatInputBar value="" onChangeText={jest.fn()} onSend={jest.fn()} />);

    const input = screen.getByPlaceholderText('Type a message...');
    expect(input.props.value).toBe('');
  });
});

