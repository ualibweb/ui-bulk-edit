import React from 'react';
import { createMemoryHistory } from 'history';
import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';

import { runAxeTest } from '@folio/stripes-testing';

import { JOB_STATUSES } from '../../constants';
import { useBulkOperationDetails } from '../../hooks/api';

import { ProgressBar } from './ProgressBar';
import { RootContext } from '../../context/RootContext';

jest.mock('../../hooks/api', () => ({
  useBulkOperationDetails: jest.fn(),
}));

const history = createMemoryHistory();

const renderProgressBar = (inAppCommitted = false) => {
  render(
    <MemoryRouter initialEntries={['/bulk-edit/1/progress?processedFileName=some.scv']}>
      <RootContext.Provider value={{ inAppCommitted }}>
        <ProgressBar />
      </RootContext.Provider>
    </MemoryRouter>,
  );
};

describe('ProgressBar', () => {
  const bulkOperation = {
    processedNumOfRecords: 50,
    totalNumOfRecords: 100,
    status: JOB_STATUSES.APPLY_CHANGES,
  };
  const clearIntervalAndRedirect = jest.fn();

  beforeEach(() => {
    clearIntervalAndRedirect.mockClear();

    useBulkOperationDetails.mockClear();
  });

  it('should display correct title', async () => {
    useBulkOperationDetails.mockReturnValue({ bulkDetails: bulkOperation });

    history.push({
      search: '?fileName=Mock.csv',
    });

    renderProgressBar();

    const title = await screen.findByText(/progressBar.title/);

    expect(title).toBeVisible();
  });

  it('should render with no axe errors', async () => {
    useBulkOperationDetails.mockReturnValue({ bulkDetails: bulkOperation });

    renderProgressBar();

    await runAxeTest({
      rootNode: document.body,
    });
  });

  it('should render with text after in app committing', async () => {
    useBulkOperationDetails.mockReturnValue({ bulkDetails: bulkOperation });

    renderProgressBar(true);

    expect(screen.getByText(/progresssBar.processing/)).toBeVisible();
  });

  it('should display correct width percentage', async () => {
    useBulkOperationDetails.mockReturnValue({ bulkDetails: bulkOperation });

    const progress = (bulkOperation.processedNumOfRecords / bulkOperation.totalNumOfRecords) * 100;

    history.push({
      search: '?processedFileName=Mock.csv',
    });

    renderProgressBar();

    const progressLine = await screen.findByTestId('progress-line');

    expect(progressLine).toBeVisible();
    expect(progressLine.getAttribute('style')).toBe(`width: ${progress}%;`);
  });

  [
    JOB_STATUSES.COMPLETED,
    JOB_STATUSES.DATA_MODIFICATION,
    JOB_STATUSES.COMPLETED_WITH_ERRORS,
    JOB_STATUSES.FAILED,
  ].forEach(status => {
    it(`should redirect to preview when status is ${status}`, async () => {
      useBulkOperationDetails.mockReturnValue({
        bulkDetails: { ...bulkOperation, status },
        clearIntervalAndRedirect,
      });

      renderProgressBar();

      expect(clearIntervalAndRedirect).toHaveBeenCalled();
    });
  });
});
