import jsonata from 'jsonata';
import { set } from 'lodash';
import { IExecuteFunctions } from 'n8n-core';
import { IDataObject, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

/**
 * This node use JSONata to query and transforma json..
 */
export class JSONata implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'JSONata',
    name: 'jsonata',
    group: ['transform'],
    version: 1,
    description: 'Use the JSONata query and transformation language.',
    defaults: {
      name: 'JSONata',
      color: '#772244',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        default: '',
        placeholder: '*',
        required: true,
        description: 'The JSONata query',
      },
      {
        displayName: 'Destination Key',
        name: 'destinationKey',
        type: 'string',
        default: 'data',
        required: true,
        placeholder: 'data',
        description:
          'The name the JSON key to copy data to. It is also possibleto define deep keys by using dot-notation like for example:"level1.level2.newKey".',
      },
      {
        displayName: 'Complete',
        name: 'complete',
        type: 'boolean',
        default: true,
        description: 'Whether to pass the input as to jsonata and not each entry individually',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const complete = this.getNodeParameter('complete', 0) as boolean;

    if (complete) {
      const destinationKey = this.getNodeParameter('destinationKey', 0) as string;
      const query = this.getNodeParameter('query', 0) as string;
      const data: IDataObject = {};
      set(data, destinationKey, jsonata(query).evaluate(items.map((item) => item.json)));
      return this.prepareOutputData([{ json: data }]);
    } else {
      let destinationKey;
      let query;
      let item;
      let newItem: INodeExecutionData;
      const returnData: INodeExecutionData[] = [];

      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        query = this.getNodeParameter('query', itemIndex) as string;
        destinationKey = this.getNodeParameter('destinationKey', itemIndex) as string;

        item = items[itemIndex];

        newItem = {
          json: JSON.parse(JSON.stringify(item.json)) as IDataObject,
        };

        if (item.binary !== undefined) {
          newItem.binary = {};
          Object.assign(newItem.binary, item.binary);
        }

        set(newItem.json, destinationKey, jsonata(query).evaluate(item.json));
        returnData.push(newItem);
      }
      return this.prepareOutputData(returnData);
    }
  }
}
