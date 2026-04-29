const asyncHandler = require('../../../utils/asyncHandler');
const service = require('./next-push.service');

exports.start = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const userId = req.user?.id || null;
    const data = await service.startPush(orderId, userId);
    res.status(201).json({ success: true, data });
});

exports.result = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    await service.recordResult(orderId, req.body || {});
    res.status(204).end();
});

exports.history = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const data = await service.getHistory(orderId);
    res.json({ success: true, data });
});

exports.startBatch = asyncHandler(async (req, res) => {
    const { orderIds } = req.body || {};
    const userId = req.user?.id || null;
    const data = await service.startBatchPush(orderIds, userId);
    res.status(201).json({ success: true, data });
});

exports.historyByCorrelation = asyncHandler(async (req, res) => {
    const data = await service.getHistoryByCorrelation(req.params.correlationId);
    res.json({ success: true, data });
});
