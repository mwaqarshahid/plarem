import { registerAlertListener, showAlert } from '@utils/alert';

describe('showAlert', () => {
  it('delivers requests to a registered listener', () => {
    const listener = jest.fn();
    const unregister = registerAlertListener(listener);

    showAlert('Title', 'Message', [{ text: 'OK' }]);

    expect(listener).toHaveBeenCalledWith({
      title: 'Title',
      message: 'Message',
      buttons: [{ text: 'OK' }],
    });

    unregister();
  });
});
