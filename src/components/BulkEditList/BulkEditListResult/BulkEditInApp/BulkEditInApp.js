import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import noop from 'lodash/noop';

import { Headline,
  IconButton,
  Col,
  Row,
  Accordion,
  Select,
  RepeatableField } from '@folio/stripes/components';

import { LocationLookup, LocationSelection } from '@folio/stripes/smart-components';
import { BulkEditInAppTitle } from './BulkEditInAppTitle/BulkEditInAppTitle';
import { ITEMS_OPTIONS,
  ITEMS_ACTION,
  ITEM_STATUS_OPTIONS,
  ACTIONS,
  OPTIONS } from '../../../../constants';
import css from './BulkEditInApp.css';

export const BulkEditInApp = ({ title, onContentUpdatesChanged }) => {
  const intl = useIntl();

  const getItems = (items) => items.map((el) => ({
    value: el.value,
    label: intl.formatMessage({ id: el.label }),
    disabled: el.disabled,
  }));

  const itemsActions = getItems(ITEMS_ACTION);
  const itemsOptions = getItems(ITEMS_OPTIONS);
  const itemStatus = getItems(ITEM_STATUS_OPTIONS);

  const defaultOption = itemsOptions[0].value;
  const defaultAction = itemsActions[0].value;
  const defaultStatus = itemStatus[0].value;

  const [fields, setFields] = useState([{
    actions: itemsActions,
    options: itemsOptions,
    status: itemStatus,
    selectedOption: defaultOption,
    selectedAction: defaultAction,
    selectedStatus: defaultStatus,
  }]);

  const [locationsState, setLocationState] = useState([{
    locationId: '',
  }]);

  const [contentUpdates, setContentUpdates] = useState([{
    option: defaultOption,
    action: defaultAction,
  }]);

  const isLocation = (index) => contentUpdates[index].action === ACTIONS.REPLACE &&
  contentUpdates[index].option !== OPTIONS.STATUS;
  const isItemStatus = (index) => contentUpdates[index].action === ACTIONS.REPLACE &&
  contentUpdates[index].option === OPTIONS.STATUS;
  const isDisabled = (index) => contentUpdates[index].option === OPTIONS.STATUS;

  const handleSelectLocation = useCallback(
    (location, index) => {
      setContentUpdates(contentUpdates.map((loc, i) => {
        if (i === index) {
          return Object.assign(loc, {
            value: location.name,
          });
        }

        return loc;
      }));
      setLocationState(locationsState.map((loc, i) => {
        if (i === index) {
          return Object.assign(loc, {
            locationId: location.id,
          });
        }

        return loc;
      }));
    },
    [contentUpdates],
  );

  const handleSelectStatus = useCallback(
    (e, index) => {
      setContentUpdates(contentUpdates.map((loc, i) => {
        if (i === index) {
          return Object.assign(loc, {
            value: e.target.value,
          });
        }

        return loc;
      }));
    },
    [contentUpdates],
  );

  const handleSelectChange = (e, index, type) => {
    setContentUpdates(contentUpdates.map((field, i) => {
      if (i === index) {
        const isOptionStatus = e.target.value === OPTIONS.STATUS;
        const value = e.target.value;

        return Object.assign(field, {
          action: ACTIONS.REPLACE,
          value: '',
          ...(isOptionStatus ? { option: value } : { [type]: value }),
        });
      }

      return field;
    }));
  };

  const handleRemove = (index) => {
    setFields([...fields.slice(0, index), ...fields.slice(index + 1, fields.length)]);
    setContentUpdates([...contentUpdates.slice(0, index), ...contentUpdates.slice(index + 1, contentUpdates.length)]);
    setLocationState([...locationsState.slice(0, index), ...locationsState.slice(index + 1, locationsState.length)]);
  };

  const handleAdd = () => {
    setFields(prevState => [...prevState, { actions: itemsActions,
      options: itemsOptions,
      status: itemStatus }]);
    setContentUpdates(prevState => [...prevState, {
      option: defaultOption,
      action: defaultAction,
    }]);
    setLocationState(prevState => [...prevState, {
      locationId: '',
    }]);
  };

  const getIsTemporaryLocation = ({ option }) => option === OPTIONS.TEMPORARY_LOCATION;

  useEffect(() => {
    onContentUpdatesChanged(contentUpdates);
  }, [contentUpdates]);

  console.log(contentUpdates);

  return (
    <>
      <Headline size="large" margin="medium">
        {title}
      </Headline>
      <Accordion
        label={<FormattedMessage id="ui-bulk-edit.layer.title" />}
      >
        <BulkEditInAppTitle />
        <RepeatableField
          fields={fields}
          className={css.row}
          onAdd={noop}
          renderField={(field, index) => (
            <Row data-testid={`row-${index}`}>
              <Col xs={6} sm={3}>
                <Select
                  dataOptions={field.options}
                  value={contentUpdates[index].options}
                  onChange={(e) => handleSelectChange(e, index, 'option')}
                  data-testid={`select-option-${index}`}
                />
              </Col>
              <Col xs={6} sm={3}>
                <Select
                  dataOptions={field.actions}
                  value={contentUpdates[index].action}
                  onChange={(e) => handleSelectChange(e, index, 'action')}
                  data-testid={`select-actions-${index}`}
                  disabled={isDisabled(index)}
                />
              </Col>

              {isLocation(index) &&
              <Col xs={6} sm={3}>
                <LocationSelection
                  value={locationsState[index].locationId}
                  onSelect={(location) => handleSelectLocation(location, index)}
                  data-test-id={`textField-${index}`}
                  placeholder={intl.formatMessage({ id: 'ui-bulk-edit.layer.selectLocation' })}
                />
                <LocationLookup
                  marginBottom0
                  onLocationSelected={(location) => handleSelectLocation(location, index)}
                  data-testid={`locationLookup-${index}`}
                  isTemporaryLocation={getIsTemporaryLocation(contentUpdates[index])}
                />
              </Col>
              }
              {isItemStatus(index) &&
                <Col xs={6} sm={3}>
                  <Select
                    dataOptions={field.status}
                    value={contentUpdates[index].value}
                    onChange={(e) => handleSelectStatus(e, index)}
                    data-testid={`select-status-${index}`}
                  />
                </Col>
              }
              <div className={css.iconButtonWrapper}>
                <IconButton
                  icon="plus-sign"
                  size="large"
                  onClick={handleAdd}
                  data-testid={`add-button-${index}`}
                />
                <IconButton
                  icon="trash"
                  onClick={() => handleRemove(index)}
                  disabled={index === 0}
                  data-testid={`remove-button-${index}`}
                />
              </div>
            </Row>
          )}
        />
      </Accordion>
    </>
  );
};

BulkEditInApp.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onContentUpdatesChanged: PropTypes.func,
};
