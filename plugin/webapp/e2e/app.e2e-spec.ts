import { WebappPage } from './app.po';

describe('webapp App', () => {
  let page: WebappPage;

  beforeEach(() => {
    page = new WebappPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
