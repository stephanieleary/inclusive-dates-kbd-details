import { newSpecPage, SpecPage } from '@stencil/core/testing';
import {
  getDaysOfMonth,
  getISODateString,
  getMonth,
  getWeekDays,
  getYear
} from '../../utils/utils';
import { WCDatepicker } from './wc-datepicker';

function getDisplayedDates(page: SpecPage) {
  return Array.from(
    page.root.querySelectorAll<HTMLTableCellElement>('.wc-datepicker__date')
  ).map((el) => +(el.children[0] as HTMLElement).innerText);
}

function getSelectedMonth(page: SpecPage) {
  return +Array.from(
    page.root
      .querySelector<HTMLSelectElement>('.wc-datepicker__month-select')
      .querySelectorAll('option')
  )
    .find((option) => option.getAttribute('selected') === '')
    .getAttribute('value');
}

function getSelectedYear(page: SpecPage) {
  return +page.root.querySelector<HTMLInputElement>(
    '.wc-datepicker__year-select'
  ).value;
}

function getWeekdaysHeader(page: SpecPage) {
  return Array.from(
    page.root.querySelectorAll<HTMLTableCellElement>('.wc-datepicker__weekday')
  ).map((el) => el.innerText);
}

function triggerKeyDown(page: SpecPage, code: string) {
  page.root
    .querySelector('.wc-datepicker__calendar')
    .dispatchEvent(new KeyboardEvent('keydown', { code }));
}

describe('wc-datepicker', () => {
  it('initially shows the current month', async () => {
    const page = await newSpecPage({
      components: [WCDatepicker],
      html: `<wc-datepicker></wc-datepicker>`,
      language: 'en'
    });

    const selectedMonth = getSelectedMonth(page);
    const selectedYear = getSelectedYear(page);
    const displayedDates = getDisplayedDates(page);

    expect(selectedMonth).toBe(getMonth(new Date()));
    expect(selectedYear).toBe(getYear(new Date()));

    expect(displayedDates).toEqual(
      getDaysOfMonth(new Date(), true, 7).map((date) => date.getDate())
    );
  });

  it('shows configured start date', async () => {
    const page = await newSpecPage({
      components: [WCDatepicker],
      html: `<wc-datepicker></wc-datepicker>`,
      language: 'en'
    });

    page.root.startDate = new Date('1989-05-16');
    await page.waitForChanges();

    const selectedMonth = getSelectedMonth(page);
    const selectedYear = getSelectedYear(page);

    expect(selectedMonth).toBe(5);
    expect(selectedYear).toBe(1989);
  });

  it('shows weekday header', async () => {
    const page = await newSpecPage({
      components: [WCDatepicker],
      html: `<wc-datepicker></wc-datepicker>`,
      language: 'en'
    });

    const weekdaysHeader1 = getWeekdaysHeader(page);

    expect(weekdaysHeader1).toEqual(
      getWeekDays(0, 'en-US').map((weekday) => weekday[0])
    );

    page.root.setAttribute('first-day-of-week', '1');
    await page.waitForChanges();

    const weekdaysHeader2 = getWeekdaysHeader(page);

    expect(weekdaysHeader2).toEqual(
      getWeekDays(1, 'en-US').map((weekday) => weekday[0])
    );

    page.root.setAttribute('locale', 'de-DE');
    await page.waitForChanges();

    const weekdaysHeader3 = getWeekdaysHeader(page);

    expect(weekdaysHeader3).toEqual(
      getWeekDays(1, 'de-DE').map((weekday) => weekday[0])
    );
  });

  it('fires selectDate events', async () => {
    const page = await newSpecPage({
      components: [WCDatepicker],
      html: `<wc-datepicker></wc-datepicker>`,
      language: 'en'
    });

    const spy = jest.fn();

    page.root.startDate = new Date('2022-01-01');
    page.root.addEventListener('selectDate', spy);

    await page.waitForChanges();

    page.root
      .querySelector<HTMLTableCellElement>('.wc-datepicker__date')
      .click();

    triggerKeyDown(page, 'ArrowRight');
    triggerKeyDown(page, 'Space');

    triggerKeyDown(page, 'ArrowDown');
    triggerKeyDown(page, 'Enter');

    triggerKeyDown(page, 'ArrowUp');
    triggerKeyDown(page, 'Enter');

    triggerKeyDown(page, 'ArrowLeft');
    triggerKeyDown(page, 'Enter');

    expect(spy.mock.calls[0][0].detail).toEqual('2021-12-26');
    expect(spy.mock.calls[1][0].detail).toEqual('2021-12-27');
    expect(spy.mock.calls[2][0].detail).toEqual('2022-01-03');
    expect(spy.mock.calls[3][0].detail).toEqual('2021-12-27');
    expect(spy.mock.calls[4][0].detail).toEqual('2021-12-26');

    page.root.setAttribute('range', 'true');
    await page.waitForChanges();

    page.root
      .querySelector<HTMLTableCellElement>('.wc-datepicker__date')
      .click();

    triggerKeyDown(page, 'ArrowRight');
    triggerKeyDown(page, 'Space');

    expect(spy.mock.calls[5][0].detail).toEqual(undefined);
    expect(spy.mock.calls[6][0].detail).toEqual(['2021-11-28']);
    expect(spy.mock.calls[7][0].detail).toEqual(['2021-11-28', '2021-11-29']);

    page.root
      .querySelector<HTMLTableCellElement>('.wc-datepicker__date')
      .click();

    expect(spy.mock.calls[6][0].detail).toEqual(['2021-11-28']);
  });

  it('highlights current date with keyboard selection', async () => {
    const page = await newSpecPage({
      components: [WCDatepicker],
      html: `<wc-datepicker></wc-datepicker>`,
      language: 'en'
    });

    page.root.startDate = new Date('2022-01-01');

    await page.waitForChanges();

    triggerKeyDown(page, 'ArrowRight');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('2');

    triggerKeyDown(page, 'ArrowRight');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('3');

    triggerKeyDown(page, 'ArrowDown');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('10');

    triggerKeyDown(page, 'ArrowLeft');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('9');

    triggerKeyDown(page, 'ArrowUp');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('2');

    triggerKeyDown(page, 'End');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('31');

    triggerKeyDown(page, 'Home');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('1');

    triggerKeyDown(page, 'PageDown');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('1');

    triggerKeyDown(page, 'PageUp');
    await page.waitForChanges();

    expect(
      page.root.querySelector('.wc-datepicker__date--current').children[0]
        .innerHTML
    ).toBe('1');
  });

  it('resets value after range prop is changed', async () => {
    const page = await newSpecPage({
      components: [WCDatepicker],
      html: `<wc-datepicker></wc-datepicker>`,
      language: 'en'
    });

    const spy = jest.fn();

    page.root.addEventListener('selectDate', spy);
    page.root.value = new Date('1989-05-16');

    page.root.setAttribute('range', 'true');

    expect(page.root.value).toBeUndefined();
    expect(spy.mock.calls[0][0].detail).toBeUndefined();
  });

  it('disables dates', async () => {
    const page = await newSpecPage({
      components: [WCDatepicker],
      html: `<wc-datepicker></wc-datepicker>`,
      language: 'en'
    });

    const spy = jest.fn();

    page.root.addEventListener('selectDate', spy);
    page.root.setAttribute('start-date', '2022-01-01');
    page.root.disableDate = (date: Date) =>
      getISODateString(date) === '2022-01-01';

    await page.waitForChanges();

    const dateCell = Array.from(
      page.root.querySelectorAll<HTMLTableCellElement>('.wc-datepicker__date')
    ).find((el) => el.dataset.date === '2022-01-01');

    dateCell.click();

    expect(dateCell.getAttribute('aria-disabled')).toBe('true');
    expect(spy).not.toHaveBeenCalled();
  });
});
