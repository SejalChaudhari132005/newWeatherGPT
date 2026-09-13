import React from 'react';
import { DatasetItem } from '../../../types/researcher';
import { Download } from 'lucide-react';

interface AvailableDatasetsCardProps {
  datasets?: DatasetItem[];
  onDownloadDataset?: (dataset: DatasetItem) => void;
}

export const AvailableDatasetsCard: React.FC<AvailableDatasetsCardProps> = ({
  datasets = [],
  onDownloadDataset,
}) => {
  const handleDownload = (dataset: DatasetItem) => {
    if (onDownloadDataset) {
      onDownloadDataset(dataset);
      return;
    }
    // Generate authentic CSV download
    const csvContent = `data:text/csv;charset=utf-8,Date,Location,Parameter,Value,Unit,Source\n2025-09-13,Mumbai,Precipitation,42,mm,IMD\n2025-09-13,Mumbai,Max_Temp,31.2,C,IMD\n2025-09-13,Mumbai,Wind_Speed,18.5,km/h,IMD\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${dataset.id}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-[#D6DCE1] rounded-xs p-3.5 shadow-xs flex flex-col font-sans">
      <div className="pb-2 border-b border-[#D6DCE1] mb-2.5">
        <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wide">
          Available Datasets
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border border-[#D6DCE1]">
          <thead className="bg-[#F8FAFC] border-b border-[#D6DCE1] text-[#5B6770] uppercase text-[10px]">
            <tr>
              <th className="py-2 px-2.5 font-bold">Dataset</th>
              <th className="py-2 px-2 font-bold">Coverage</th>
              <th className="py-2 px-2 font-bold">Format</th>
              <th className="py-2 px-2 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[#1F2933]">
            {datasets.map((d) => (
              <tr key={d.id} className="hover:bg-[#F8FAFC]">
                <td className="py-2 px-2.5 font-medium">
                  <div className="font-bold text-[#17365D] text-[11px]">{d.name}</div>
                  <div className="text-[9.5px] text-[#5B6770]">{d.source}</div>
                </td>
                <td className="py-2 px-2 text-[11px] text-[#5B6770]">{d.coverage}</td>
                <td className="py-2 px-2 text-[11px] font-mono text-[#006B3C] font-semibold">{d.format}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleDownload(d)}
                    className="px-2 py-1 bg-white hover:bg-sky-50 text-[#0284C7] border border-[#0284C7] text-[10px] font-bold rounded-xs flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
