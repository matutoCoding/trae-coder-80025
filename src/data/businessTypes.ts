import { BusinessType } from '@/types';

export const businessTypes: BusinessType[] = [
  {
    id: 'biz_001',
    name: '社保缴纳查询',
    category: 'social',
    description: '查询个人社保缴纳记录、缴费明细、账户余额等信息',
    estimatedTime: 15,
    requiredDocuments: ['身份证原件', '社保卡'],
    windowNumber: 'A01',
    icon: '社'
  },
  {
    id: 'biz_002',
    name: '养老保险转移',
    category: 'social',
    description: '办理跨区域养老保险关系转移接续手续',
    estimatedTime: 25,
    requiredDocuments: ['身份证原件', '原参保地缴费凭证', '户口本'],
    windowNumber: 'A02',
    icon: '养'
  },
  {
    id: 'biz_003',
    name: '户籍迁移办理',
    category: 'household',
    description: '市内迁移、市外迁入、迁出等户籍变更业务',
    estimatedTime: 30,
    requiredDocuments: ['身份证原件', '户口本', '房产证/租房合同', '迁移证明'],
    windowNumber: 'B01',
    icon: '户'
  },
  {
    id: 'biz_004',
    name: '身份证补办',
    category: 'household',
    description: '身份证遗失补办、损坏换领、到期换领',
    estimatedTime: 20,
    requiredDocuments: ['户口本原件', '现场采集照片'],
    windowNumber: 'B02',
    icon: '身'
  },
  {
    id: 'biz_005',
    name: '不动产登记',
    category: 'property',
    description: '房屋所有权登记、抵押登记、变更登记等',
    estimatedTime: 45,
    requiredDocuments: ['身份证原件', '购房合同', '完税证明', '房屋平面图'],
    windowNumber: 'C01',
    icon: '房'
  },
  {
    id: 'biz_006',
    name: '不动产权证查询',
    category: 'property',
    description: '查询不动产登记信息、产权状态、抵押情况等',
    estimatedTime: 10,
    requiredDocuments: ['身份证原件', '房产证/不动产证号'],
    windowNumber: 'C02',
    icon: '查'
  },
  {
    id: 'biz_007',
    name: '个人所得税申报',
    category: 'tax',
    description: '年度综合所得汇算清缴、专项附加扣除申报',
    estimatedTime: 20,
    requiredDocuments: ['身份证原件', '收入证明', '扣除凭证'],
    windowNumber: 'D01',
    icon: '税'
  },
  {
    id: 'biz_008',
    name: '发票代开',
    category: 'tax',
    description: '个人/小规模纳税人增值税普通发票代开',
    estimatedTime: 15,
    requiredDocuments: ['身份证原件', '代开申请单', '合同/协议'],
    windowNumber: 'D02',
    icon: '票'
  },
  {
    id: 'biz_009',
    name: '营业执照办理',
    category: 'cert',
    description: '个体工商户、有限公司营业执照设立、变更、注销',
    estimatedTime: 40,
    requiredDocuments: ['身份证原件', '经营场所证明', '公司章程', '名称核准通知书'],
    windowNumber: 'E01',
    icon: '营'
  },
  {
    id: 'biz_010',
    name: '经营许可证办理',
    category: 'cert',
    description: '食品经营、卫生许可等各类经营许可证办理',
    estimatedTime: 35,
    requiredDocuments: ['身份证原件', '营业执照', '场所布局图', '健康证'],
    windowNumber: 'E02',
    icon: '许'
  },
  {
    id: 'biz_011',
    name: '婚姻登记',
    category: 'other',
    description: '结婚登记、离婚登记、补领婚姻证书',
    estimatedTime: 25,
    requiredDocuments: ['身份证原件', '户口本', '双人照片', '无配偶声明'],
    windowNumber: 'F01',
    icon: '婚'
  },
  {
    id: 'biz_012',
    name: '综合咨询',
    category: 'other',
    description: '政策咨询、业务指引、办事指南等综合服务',
    estimatedTime: 10,
    requiredDocuments: ['无需材料'],
    windowNumber: '咨询台',
    icon: '咨'
  }
];

export const categoryNames: Record<string, string> = {
  social: '社保服务',
  household: '户政服务',
  property: '不动产服务',
  tax: '税务服务',
  cert: '证照办理',
  other: '其他服务'
};

export const categoryColors: Record<string, string> = {
  social: '#3498DB',
  household: '#9B59B6',
  property: '#1ABC9C',
  tax: '#E67E22',
  cert: '#F1C40F',
  other: '#95A5A6'
};
