/* eslint-disable react/prop-types */

import { components } from 'react-select';
import {
  CaretSortIcon,
  CheckIcon,
  Cross2Icon as CloseIcon
} from '@radix-ui/react-icons';

export const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <CaretSortIcon className={'h-4 w-4 opacity-50'} />
    </components.DropdownIndicator>
  );
};

export const ClearIndicator = (props) => {
  return (
    <components.ClearIndicator {...props}>
      <CloseIcon className={'h-3.5 w-3.5 opacity-50'} />
    </components.ClearIndicator>
  );
};

export const MultiValueRemove = (props) => {
  return (
    <components.MultiValueRemove {...props}>
      <CloseIcon className={'h-3 w-3 opacity-50'} />
    </components.MultiValueRemove>
  );
};

export const Option = (props) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between">
        <div>{props.data.label}</div>
        {props.isSelected && <CheckIcon />}
      </div>
    </components.Option>
  );
};