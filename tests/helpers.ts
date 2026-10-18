import type { Unit } from '../src/types';

export function sampleUnit(): Unit {
  return {
    courseId: 'http',
    unitId: 'http-request-once',
    title: '一次 HTTP 请求',
    published: true,
    paths: {
      normal: {
        steps: [
          step('dns', 'DNS', 'advance', '小白 DNS', '专业 DNS'),
          step('tcp', 'TCP', 'advance', '小白 TCP', '专业 TCP'),
          step('tls', 'TLS', 'advance', '小白 TLS', '专业 TLS'),
          {
            ...step('pack', '组包', 'pack', '小白组包', '专业组包'),
            failHint: { beginner: '这封信还寄不出去', pro: 'Method、Path 或 Host 不合法' },
            packRule: {
              fields: ['Method', 'Path', 'Host'],
              validCombinations: [{ Method: 'GET', Path: '/', Host: 'example.com' }],
            },
          },
          step('response', '响应', 'advance', '小白响应', '专业响应'),
        ],
      },
      fault: {
        steps: [
          {
            ...step('dns', 'DNS', 'repair', '域名问错了', 'DNS NXDOMAIN'),
            skippable: true,
            failHint: { beginner: '还是那个找不到的名字', pro: '查询名仍是 example.invalid' },
            repair: {
              successAction: 'use-example-com',
              options: [
                { id: 'keep-invalid', label: { beginner: '继续问错误名字', pro: '保持 example.invalid' } },
                { id: 'use-example-com', label: { beginner: '改问 example.com', pro: '查询 example.com' } },
              ],
            },
          },
          {
            ...step('tcp', 'TCP', 'repair', '端口被拒绝', 'SYN 无应答'),
            skippable: true,
            failHint: { beginner: '这条路还是不通', pro: '目标端口仍拒绝连接' },
            repair: {
              successAction: 'connect-443',
              options: [
                { id: 'keep-80', label: { beginner: '继续撞原来的端口', pro: '维持 80' } },
                { id: 'connect-443', label: { beginner: '改连 443', pro: '向 443 重新握手' } },
              ],
            },
          },
          {
            ...step('tls', 'TLS', 'repair', '锁上的名字对不上', '证书主体不匹配'),
            skippable: true,
            failHint: { beginner: '名字还是对不上', pro: '证书 SAN 仍不包含目标主机' },
            repair: {
              successAction: 'match-cert-name',
              options: [
                { id: 'ignore-cert', label: { beginner: '不管证书继续走', pro: '跳过证书校验' } },
                { id: 'match-cert-name', label: { beginner: '换名字相符的连接', pro: '使用匹配 example.com 的证书' } },
              ],
            },
          },
          {
            ...step('pack', '组包', 'pack', '故障时拼这封信', '在故障场景组装请求'),
            skippable: true,
            failHint: { beginner: '这封信还寄不出去', pro: 'Method、Path 或 Host 不合法' },
            packRule: {
              fields: ['Method', 'Path', 'Host'],
              validCombinations: [{ Method: 'GET', Path: '/', Host: 'example.com' }],
            },
          },
          {
            ...step('response', '响应', 'repair', '网关暂时没拿到页面', '上游返回 502'),
            skippable: true,
            completionResult: 'passed',
            failHint: { beginner: '页面还是没回来', pro: '上游仍为 502' },
            repair: {
              successAction: 'retry-upstream',
              options: [
                { id: 'accept-502', label: { beginner: '把报错页当成结果', pro: '接受 502 正文' } },
                { id: 'retry-upstream', label: { beginner: '让网关再试一次', pro: '重试上游直到 200' } },
              ],
            },
            whenPrior: {
              stepId: 'pack',
              result: 'skipped',
              copy: {
                beginner: '信没有寄出，所以没有正常回信。',
                pro: '组包已跳过，未发送合法请求，响应以失败结束。',
              },
              stepType: 'advance',
              completionResult: 'failed',
              skippable: false,
            },
          },
        ],
      },
    },
  };
}

function step(
  stepId: string,
  title: string,
  stepType: 'advance' | 'pack' | 'repair',
  beginner: string,
  pro: string,
) {
  return {
    stepId,
    title,
    stepType,
    copy: { beginner, pro },
  };
}
