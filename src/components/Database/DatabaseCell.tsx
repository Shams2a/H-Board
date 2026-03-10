/**
 * DatabaseCell Component
 * Renders the appropriate cell editor based on property type
 */

import type { DatabaseProperty, DatabaseRow } from '../../types';
import TextCell from './cells/TextCell';
import NumberCell from './cells/NumberCell';
import CheckboxCell from './cells/CheckboxCell';
import DateCell from './cells/DateCell';
import SelectCell from './cells/SelectCell';
import MultiSelectCell from './cells/MultiSelectCell';
import URLCell from './cells/URLCell';
import EmailCell from './cells/EmailCell';
import PhoneCell from './cells/PhoneCell';
import BoardCell from './cells/BoardCell';

interface DatabaseCellProps {
  row: DatabaseRow;
  property: DatabaseProperty;
  value: any;
  onUpdate: (value: any) => void;
}

export default function DatabaseCell({ row: _row, property, value, onUpdate }: DatabaseCellProps) {
  switch (property.type) {
    case 'title':
      return <TextCell value={value} onChange={onUpdate} isTitle />;

    case 'text':
      return <TextCell value={value} onChange={onUpdate} />;

    case 'number':
      return (
        <NumberCell
          value={value}
          onChange={onUpdate}
          format={property.config?.numberFormat}
        />
      );

    case 'checkbox':
      return <CheckboxCell value={value} onChange={onUpdate} />;

    case 'date':
      return (
        <DateCell
          value={value}
          onChange={onUpdate}
          includeTime={property.config?.includeTime}
        />
      );

    case 'select':
      return (
        <SelectCell
          value={value}
          onChange={onUpdate}
          options={property.config?.options || []}
        />
      );

    case 'multi_select':
      return (
        <MultiSelectCell
          value={value || []}
          onChange={onUpdate}
          options={property.config?.options || []}
        />
      );

    case 'url':
      return <URLCell value={value} onChange={onUpdate} />;

    case 'email':
      return <EmailCell value={value} onChange={onUpdate} />;

    case 'phone':
      return <PhoneCell value={value} onChange={onUpdate} />;

    case 'board':
      return <BoardCell value={value} onChange={onUpdate} />;

    default:
      // Fallback for unsupported types
      return (
        <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400 italic">
          Type "{property.type}" not yet implemented
        </div>
      );
  }
}
