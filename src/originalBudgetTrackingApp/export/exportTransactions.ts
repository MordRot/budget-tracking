import { Config } from '@/originalBudgetTrackingApp/configManager/configManager';
import {
  AccountStatus, EventNames, EventPublisher, ExporterEvent
} from '@/originalBudgetTrackingApp/eventEmitters/EventEmitter';
import { EnrichedTransaction } from '@/originalBudgetTrackingApp/commonTypes';
import _ from 'lodash';
import outputVendors from '@/originalBudgetTrackingApp/export/outputVendors';

export async function createTransactionsInExternalVendors(
  outputVendorsConfig: Config['outputVendors'],
  companyIdToTransactions: Record<string, EnrichedTransaction[]>,
  startDate: Date, eventPublisher: EventPublisher
) {
  await eventPublisher.emit(EventNames.EXPORT_PROCESS_START);
  const executionResult = {};
  const allTransactions = _.flatten(Object.values(companyIdToTransactions));

  const exportPromises = outputVendors.map(async (outputVendor) => {
    if (outputVendorsConfig[outputVendor.name]?.active) {
      const baseEvent = {
        exporterName: outputVendor.name,
        allTransactions
      };

      await outputVendor.init?.(outputVendorsConfig);
      await eventPublisher.emit(EventNames.EXPORTER_START, new ExporterEvent({ message: 'Starting', ...baseEvent }));
      try {
        const vendorResult = await outputVendor.exportTransactions({
          transactionsToCreate: allTransactions, startDate, outputVendorsConfig
        }, eventPublisher);
        await eventPublisher.emit(EventNames.EXPORTER_END, new ExporterEvent({ message: 'Finished', ...baseEvent, status: AccountStatus.DONE }));
        executionResult[outputVendor.name] = vendorResult;
      } catch (e) {
        await eventPublisher.emit(EventNames.EXPORTER_ERROR, new ExporterEvent({
          message: e.message, error: e, exporterName: baseEvent.exporterName, allTransactions
        }));
        throw e;
      }
    }
  });

  await Promise.all(exportPromises);
  if (!Object.keys(executionResult).length) {
    const error = new Error('You need to set at least one output vendor to be active');
    throw error;
  }

  await eventPublisher.emit(EventNames.EXPORT_PROCESS_END);
  return executionResult;
}
